export type SkillGroup = {
  id: "cloud" | "languages" | "linux" | "ai";
  items: { name: string; sync: number }[];
};

export const skills: SkillGroup[] = [
  {
    id: "cloud",
    items: [
      { name: "AWS Lambda", sync: 80 },
      { name: "DynamoDB", sync: 75 },
      { name: "Amazon Bedrock", sync: 72 },
      { name: "S3 / CloudFront", sync: 75 },
      { name: "IAM", sync: 70 },
      { name: "CDK / Amplify", sync: 68 },
    ],
  },
  {
    id: "languages",
    items: [
      { name: "TypeScript", sync: 80 },
      { name: "Python", sync: 78 },
      { name: "Java", sync: 70 },
      { name: "C++", sync: 65 },
      { name: "Go", sync: 30 },
    ],
  },
  {
    id: "linux",
    items: [
      { name: "Linux / Arch", sync: 82 },
      { name: "Hyprland / QML", sync: 65 },
      { name: "Bash", sync: 72 },
      { name: "Git / GitHub Actions", sync: 78 },
      { name: "Docker", sync: 65 },
    ],
  },
  {
    id: "ai",
    items: [
      { name: "Amazon Bedrock", sync: 72 },
      { name: "Strands Agents", sync: 70 },
      { name: "Prompt / guardrail design", sync: 75 },
    ],
  },
];
