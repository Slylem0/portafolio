import { describe, it, expect } from "vitest";
import { getTriadUrl, readTriadUrl } from "@/lib/config";

describe("config", () => {
  it("getTriadUrl returns null when outputs absent", () => {
    expect(readTriadUrl({})).toBeNull();
  });
  it("reads custom.triadUrl from amplify_outputs.json", () => {
    const url = "https://abc.lambda-url.us-east-1.on.aws/";
    expect(readTriadUrl({ "/amplify_outputs.json": { default: { custom: { triadUrl: url } } } })).toBe(url);
    expect(readTriadUrl({ "/amplify_outputs.json": { custom: { triadUrl: url } } })).toBe(url);
  });
  it("returns null for missing or non-https url", () => {
    expect(readTriadUrl({ "/amplify_outputs.json": { default: { version: "1.4" } } })).toBeNull();
    expect(readTriadUrl({ "/amplify_outputs.json": { default: { custom: { triadUrl: 42 } } } })).toBeNull();
    expect(readTriadUrl({ "/amplify_outputs.json": { default: { custom: { triadUrl: "javascript:alert(1)" } } } })).toBeNull();
  });
  it("getTriadUrl returns a string or null", () => {
    const v = getTriadUrl();
    expect(v === null || typeof v === "string").toBe(true);
  });
});
