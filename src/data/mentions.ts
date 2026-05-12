export type Sentiment = "positive" | "negative" | "neutral" | "unclassified";
export type Source = "Twitter" | "Reddit" | "Forum" | "News" | "Blog" | "Review";
export type Priority = "low" | "medium" | "high" | "critical";
export type Status = "unreviewed" | "in-review" | "resolved" | "escalated";
export type Topic = "pricing" | "service" | "quality" | "delivery" | "support" | "design" | "performance" | "safety";

export interface Mention {
  id: string;
  brand: string;
  source: Source;
  author: string;
  text: string;
  timestamp: string;
  region: string;
  language: string;
  sentiment: Sentiment;
  confidence: number;
  topics: Topic[];
  priority: Priority;
  status: Status;
  engagement: number;
  url: string;
  is_crisis?: boolean;
  isCrisis?: boolean;
}

// Loaded from data/mentions_classified.json — produced by classifier/classify.py
import raw from "../../data/mentions_classified.json";

const mentions: Mention[] = (raw as any[]).map((m) => ({
  ...m,
  // normalise snake_case from JSON to camelCase for the app
  isCrisis: m.is_crisis === true || m.is_crisis === "true" || m.is_crisis === "True",
  topics: Array.isArray(m.topics) ? m.topics : [],
}));

export default mentions;

export const trackedBrands = [
  { id: "nike", name: "Nike", keywords: ["Nike", "JustDoIt", "NikeShoes"], color: "#f97316" },
  { id: "tesla", name: "Tesla", keywords: ["Tesla", "ElonMusk", "EV", "TeslaCar"], color: "#3b82f6" },
  { id: "apple", name: "Apple", keywords: ["Apple", "iPhone", "MacBook", "WWDC"], color: "#8b5cf6" },
];
