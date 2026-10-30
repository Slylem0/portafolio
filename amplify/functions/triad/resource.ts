import { defineFunction } from "@aws-amplify/backend";

export const triad = defineFunction({
  name: "triad",
  entry: "./handler.ts",
  runtime: 22,
  timeoutSeconds: 15,
  memoryMB: 256,
});
