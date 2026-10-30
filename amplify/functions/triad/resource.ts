import { defineFunction } from "@aws-amplify/backend";

export const triad = defineFunction({
  name: "triad",
  entry: "./handler.ts",
  runtime: 22,
  timeoutSeconds: 15,
  memoryMB: 256,
  // Amplify creates an explicit log group with this retention (CloudWatch keeps logs forever by default).
  logging: { retention: "2 weeks" },
});
