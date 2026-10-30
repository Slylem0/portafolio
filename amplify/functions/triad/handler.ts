import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { buildSystemPrompt } from "./prompt";
import { parseModelOutput, validateQuestion } from "./parse";
import { checkRateLimit } from "./rateLimit";

export type Deps = {
  converse(system: string, question: string): Promise<string>;
  db: { increment(key: string, ttl: number): Promise<number> };
  now(): Date;
};

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
    const done = (status: number, body?: unknown) => {
      console.log(JSON.stringify({ event: "triad", status, qLen, lang, ms: Date.now() - t0 }));
      return body === undefined ? { statusCode: status } : json(status, body);
    };

    if (event.requestContext?.http?.method === "OPTIONS") return done(204);

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
      const text = await deps.converse(buildSystemPrompt(input.lang), input.question);
      const result = parseModelOutput(text);
      if (!result) return done(502, { error: "bad_model_output" });
      return done(200, result);
    } catch {
      return done(502, { error: "upstream_error" });
    }
  };
}

let bedrock: BedrockRuntimeClient | undefined;
let ddb: DynamoDBClient | undefined;

export const handler = createHandler({
  async converse(system, question) {
    bedrock ??= new BedrockRuntimeClient({ region: "us-east-1" });
    const out = await bedrock.send(
      new ConverseCommand({
        modelId: "us.amazon.nova-lite-v1:0",
        system: [{ text: system }],
        messages: [{ role: "user", content: [{ text: question }] }],
        inferenceConfig: { maxTokens: 300, temperature: 0.7 },
      }),
    );
    return out.output?.message?.content?.map((c) => c.text ?? "").join("") ?? "";
  },
  db: {
    async increment(key, ttl) {
      ddb ??= new DynamoDBClient({});
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
      return Number(out.Attributes?.count?.N ?? "1");
    },
  },
  now: () => new Date(),
});
