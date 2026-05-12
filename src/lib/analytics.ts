import mentions, { Mention } from "@/data/mentions";
import { format, subDays, parseISO, startOfWeek } from "date-fns";

// Use the latest timestamp in the dataset as "now" so charts always work
const DATASET_NOW = new Date(
  Math.max(...mentions.map((m) => new Date(m.timestamp).getTime()))
);

export interface DailyTrend {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface WeeklyTrend {
  week: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface TopicStat {
  topic: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface KpiStats {
  totalMentions: number;
  positive: number;
  negative: number;
  neutral: number;
  unclassified: number;
  positivePercent: number;
  negativePercent: number;
  neutralPercent: number;
  velocityChange: number;
  negativeShareChange: number;
  anomalyScore: number;
}

export function getKpis(filtered: Mention[]): KpiStats {
  const total = filtered.length;
  const pos = filtered.filter((m) => m.sentiment === "positive").length;
  const neg = filtered.filter((m) => m.sentiment === "negative").length;
  const neu = filtered.filter((m) => m.sentiment === "neutral").length;
  const unc = filtered.filter((m) => m.sentiment === "unclassified").length;

  const now = DATASET_NOW;
  const last7 = filtered.filter((m) => new Date(m.timestamp) >= subDays(now, 7)).length;
  const prev7 = filtered.filter(
    (m) => new Date(m.timestamp) >= subDays(now, 14) && new Date(m.timestamp) < subDays(now, 7)
  ).length;
  const velocityChange = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : 0;

  const negLast7 = filtered.filter(
    (m) => m.sentiment === "negative" && new Date(m.timestamp) >= subDays(now, 7)
  ).length;
  const negPrev7 = filtered.filter(
    (m) => m.sentiment === "negative" &&
    new Date(m.timestamp) >= subDays(now, 14) &&
    new Date(m.timestamp) < subDays(now, 7)
  ).length;
  const negShareLast = last7 > 0 ? (negLast7 / last7) * 100 : 0;
  const negSharePrev = prev7 > 0 ? (negPrev7 / prev7) * 100 : 0;
  const negativeShareChange = Math.round(negShareLast - negSharePrev);

  const dailyNegAvg = neg / 30;
  const last24neg = filtered.filter(
    (m) => m.sentiment === "negative" && new Date(m.timestamp) >= subDays(now, 1)
  ).length;
  const anomalyScore = Math.min(100, Math.round((last24neg / Math.max(dailyNegAvg, 1)) * 20));

  return {
    totalMentions: total,
    positive: pos,
    negative: neg,
    neutral: neu,
    unclassified: unc,
    positivePercent: total > 0 ? Math.round((pos / total) * 100) : 0,
    negativePercent: total > 0 ? Math.round((neg / total) * 100) : 0,
    neutralPercent: total > 0 ? Math.round((neu / total) * 100) : 0,
    velocityChange,
    negativeShareChange,
    anomalyScore,
  };
}

export function getDailyTrends(filtered: Mention[], days = 30): DailyTrend[] {
  const result: DailyTrend[] = [];
  const now = DATASET_NOW;

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(now, i);
    const dateStr = format(date, "MMM d");
    const dayMentions = filtered.filter(
      (m) => format(parseISO(m.timestamp), "MMM d") === dateStr
    );
    result.push({
      date: dateStr,
      positive: dayMentions.filter((m) => m.sentiment === "positive").length,
      negative: dayMentions.filter((m) => m.sentiment === "negative").length,
      neutral: dayMentions.filter((m) => m.sentiment === "neutral").length,
      total: dayMentions.length,
    });
  }
  return result;
}

export function getWeeklyTrends(filtered: Mention[], weeks = 4): WeeklyTrend[] {
  const result: WeeklyTrend[] = [];
  const now = DATASET_NOW;

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subDays(now, i * 7));
    const weekEnd = subDays(now, (i - 1) * 7);
    const weekLabel = `${format(weekStart, "MMM d")}`;
    const weekMentions = filtered.filter((m) => {
      const t = new Date(m.timestamp);
      return t >= weekStart && t < weekEnd;
    });
    result.push({
      week: weekLabel,
      positive: weekMentions.filter((m) => m.sentiment === "positive").length,
      negative: weekMentions.filter((m) => m.sentiment === "negative").length,
      neutral: weekMentions.filter((m) => m.sentiment === "neutral").length,
      total: weekMentions.length,
    });
  }
  return result;
}

export function getTopicStats(filtered: Mention[]): TopicStat[] {
  const topicMap: Record<string, { positive: number; negative: number; neutral: number }> = {};

  for (const m of filtered) {
    for (const topic of m.topics) {
      if (!topicMap[topic]) topicMap[topic] = { positive: 0, negative: 0, neutral: 0 };
      if (m.sentiment === "positive") topicMap[topic].positive++;
      else if (m.sentiment === "negative") topicMap[topic].negative++;
      else topicMap[topic].neutral++;
    }
  }

  return Object.entries(topicMap)
    .map(([topic, counts]) => ({
      topic,
      ...counts,
      total: counts.positive + counts.negative + counts.neutral,
    }))
    .sort((a, b) => b.total - a.total);
}

export function getSourceBreakdown(filtered: Mention[]) {
  const sources = ["Twitter", "Reddit", "Forum", "News", "Blog", "Review"];
  return sources.map((source) => {
    const s = filtered.filter((m) => m.source === source);
    return {
      source,
      total: s.length,
      positive: s.filter((m) => m.sentiment === "positive").length,
      negative: s.filter((m) => m.sentiment === "negative").length,
    };
  });
}
