import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { buildSystemPrompt } from "./prompt";
import { parseModelOutput, validateQuestion } from "./parse";
import { checkRateLimit } from "./rateLimit";

export type ConverseOpts = { temperature?: number; timeoutMs?: number };
export type Deps = {
  converse(system: string, question: string, opts?: ConverseOpts): Promise<string>;
  db: { increment(key: string, ttl: number): Promise<number> };
  now(): Date;
};

// Lambda timeout is 15 s; keep the whole request (incl. one retry) under this budget.
const BUDGET_MS = 13_000;
// A retry needs at least this much budget left to be worth attempting.
const MIN_RETRY_MS = 3_000;

const json = (statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export function createHandler(deps: Deps) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
    const t0 = Date.now();
    let lang = "en";
    let qLen = 0;
    const done = (status: number, body?: unknown, errName?: string) => {
      console.log(JSON.stringify({ event: "triad", status, qLen, lang, ms: Date.now() - t0, ...(errName ? { err: errName } : {}) }));
      return body === undefined ? { statusCode: status } : json(status, body);
    };

    const method = event.requestContext?.http?.method;
    if (method === "OPTIONS") return done(204);
    if (method !== "POST") return done(405, { error: "method_not_allowed" });

    let parsed: unknown;
    try {
      const raw = event.isBase64Encoded && event.body ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
      parsed = JSON.parse(raw ?? "");
    } catch {
      return done(400, { error: "invalid_request" });
    }
    const input = validateQuestion(parsed);
    if (!input) return done(400, { error: "invalid_question" });
    lang = input.lang;
    qLen = input.question.length;

    try {
      const ip = event.requestContext?.http?.sourceIp ?? "unknown";
      if (!(await checkRateLimit(deps.db, ip, deps.now()))) return done(429, { error: "rate_limited" });
      const system = buildSystemPrompt(input.lang);
      const question = `<question>${input.question.replace(/[<>]/g, "")}</question>`;
      let result = parseModelOutput(await deps.converse(system, question));
      // Nova occasionally emits non-JSON; one cooler retry fixes most of those (same rate-limit slot).
      const left = BUDGET_MS - (Date.now() - t0);
      if (!result && left >= MIN_RETRY_MS) {
        result = parseModelOutput(await deps.converse(system, question, { temperature: 0.2, timeoutMs: left }));
      }
      if (!result) return done(502, { error: "bad_model_output" });
      return done(200, result);
    } catch (err) {
      return done(502, { error: "upstream_error" }, err instanceof Error ? err.name : "unknown");
    }
  };
}

let bedrock: BedrockRuntimeClient | undefined;
let ddb: DynamoDBClient | undefined;

export const handler = createHandler({
  async converse(system, question, opts) {
    bedrock ??= new BedrockRuntimeClient({
      region: "us-east-1",
      maxAttempts: 2,
      requestHandler: new NodeHttpHandler({ connectionTimeout: 2000, requestTimeout: 6000 }),
    });
    const out = await bedrock.send(
      new ConverseCommand({
        modelId: "us.amazon.nova-lite-v1:0",
        system: [{ text: system }],
        messages: [{ role: "user", content: [{ text: question }] }],
        inferenceConfig: { maxTokens: 300, temperature: opts?.temperature ?? 0.7 },
      }),
      opts?.timeoutMs ? { abortSignal: AbortSignal.timeout(opts.timeoutMs) } : undefined,
    );
    return out.output?.message?.content?.map((c) => c.text ?? "").join("") ?? "";
  },
  db: {
    async increment(key, ttl) {
      ddb ??= new DynamoDBClient({
        maxAttempts: 2,
        requestHandler: new NodeHttpHandler({ connectionTimeout: 1000, requestTimeout: 2000 }),
      });
      const out = await ddb.send(
        new UpdateItemCommand({
          TableName: process.env.TRIAD_TABLE,
          Key: { pk: { S: key } },
          UpdateExpression: "ADD #c :one SET #t = :ttl",
          ExpressionAttributeNames: { "#c": "count", "#t": "ttl" },
          ExpressionAttributeValues: { ":one": { N: "1" }, ":ttl": { N: String(ttl) } },
          ReturnValues: "UPDATED_NEW",
        }),
      );
      return Number(out.Attributes?.count?.N ?? Number.POSITIVE_INFINITY);
    },
  },
  now: () => new Date(),
});
