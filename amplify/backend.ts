import { randomBytes } from "node:crypto";
import { defineBackend } from "@aws-amplify/backend";
import { Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { CfnFunction, FunctionUrlAuthType, HttpMethod } from "aws-cdk-lib/aws-lambda";
import { triad } from "./functions/triad/resource";

const backend = defineBackend({ triad });

const fn = backend.triad.resources.lambda;
const dataStack = backend.createStack("triad-data");

const table = new Table(dataStack, "TriadUsage", {
  partitionKey: { name: "pk", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: "ttl",
  removalPolicy: RemovalPolicy.DESTROY,
});

const cfnFn = backend.triad.resources.cfnResources.cfnFunction as CfnFunction;
// Reserved concurrency 5 caps Bedrock spend under bursts. Lambda requires >= 10 *unreserved*
// concurrency, so accounts still on the default quota of 10 cannot reserve any; such a deploy can
// opt out with TRIAD_RESERVED_CONCURRENCY=0 (the account-wide limit of 10 then caps the function).
const reserved = Number(process.env.TRIAD_RESERVED_CONCURRENCY ?? 5);
if (reserved > 0) cfnFn.reservedConcurrentExecutions = reserved;
backend.triad.addEnvironment("TRIAD_TABLE", table.tableName);
// Per-synth random salt for hashing visitor IPs; rotates on each deploy (counters are hourly anyway).
backend.triad.addEnvironment("TRIAD_SALT", randomBytes(16).toString("hex"));

fn.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["dynamodb:UpdateItem"],
    resources: [table.tableArn],
  }),
);

const { account } = Stack.of(fn);
fn.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel"],
    resources: [
      `arn:aws:bedrock:us-east-1:${account}:inference-profile/us.amazon.nova-lite-v1:0`,
      "arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0",
    ],
  }),
);

const url = fn.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: [
      "https://main.dx1vkp1smlyu7.amplifyapp.com",
      "http://localhost:4321",
      "http://127.0.0.1:4400",
      "http://localhost:4400",
    ],
    allowedMethods: [HttpMethod.POST],
    allowedHeaders: ["content-type"],
    maxAge: Duration.days(1),
  },
});

backend.addOutput({ custom: { triadUrl: url.url } });
