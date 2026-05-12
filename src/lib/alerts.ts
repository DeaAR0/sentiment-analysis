import mentions, { Mention } from "@/data/mentions";
import { subDays } from "date-fns";

// Use latest timestamp in dataset so alerts always fire correctly
const DATASET_NOW = new Date(
  Math.max(...mentions.map((m) => new Date(m.timestamp).getTime()))
);

export interface Alert {
  id: string;
  type: "negative_spike" | "volume_spike" | "crisis";
  brand: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  timestamp: string;
  mentionCount: number;
  relatedMentionIds: string[];
}

function getMentionsInWindow(brand: string, hoursBack: number): Mention[] {
  const cutoff = subDays(DATASET_NOW, hoursBack / 24);
  return mentions.filter(
    (m) => m.brand === brand && new Date(m.timestamp) >= cutoff
  );
}

function getDailyAverage(brand: string, days: number): number {
  const cutoff = subDays(DATASET_NOW, days);
  const window = mentions.filter(
    (m) => m.brand === brand && new Date(m.timestamp) >= cutoff
  );
  return window.length / days;
}

export function generateAlerts(): Alert[] {
  const alerts: Alert[] = [];
  const brands = ["Nike", "Tesla", "Apple"];

  for (const brand of brands) {
    const last24h = getMentionsInWindow(brand, 24);
    const neg24h = last24h.filter((m) => m.sentiment === "negative");
    const crisis = last24h.filter((m) => m.isCrisis);
    const dailyAvg = getDailyAverage(brand, 7);
    const negAvg = getDailyAverage(brand, 7) * 0.3;

    if (crisis.length > 0) {
      alerts.push({
        id: `alert-crisis-${brand.toLowerCase()}`,
        type: "crisis",
        brand,
        severity: "critical",
        title: `Crisis Signal Detected — ${brand}`,
        description: `${crisis.length} mention(s) flagged as potential crisis events in the last 24 hours. Immediate review recommended.`,
        timestamp: crisis[0].timestamp,
        mentionCount: crisis.length,
        relatedMentionIds: crisis.map((m) => m.id),
      });
    }

    if (neg24h.length > negAvg * 2 && neg24h.length >= 3) {
      alerts.push({
        id: `alert-negspike-${brand.toLowerCase()}`,
        type: "negative_spike",
        brand,
        severity: neg24h.length > 10 ? "high" : "medium",
        title: `Negative Sentiment Spike — ${brand}`,
        description: `${neg24h.length} negative mentions in last 24h vs. ~${Math.round(negAvg)} daily average (${Math.round((neg24h.length / Math.max(negAvg, 1)) * 100)}% above baseline).`,
        timestamp: neg24h[0]?.timestamp ?? new Date().toISOString(),
        mentionCount: neg24h.length,
        relatedMentionIds: neg24h.map((m) => m.id),
      });
    }

    if (last24h.length > dailyAvg * 3 && last24h.length >= 5) {
      alerts.push({
        id: `alert-volspike-${brand.toLowerCase()}`,
        type: "volume_spike",
        brand,
        severity: "medium",
        title: `Unusual Mention Volume — ${brand}`,
        description: `${last24h.length} mentions in last 24h vs. ~${Math.round(dailyAvg)} daily average. Unusual activity detected.`,
        timestamp: last24h[0]?.timestamp ?? new Date().toISOString(),
        mentionCount: last24h.length,
        relatedMentionIds: last24h.map((m) => m.id),
      });
    }
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
