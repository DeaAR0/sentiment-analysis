"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getTopicStats } from "@/lib/analytics";
import mentions, { trackedBrands } from "@/data/mentions";
import Link from "next/link";
import { SentimentBadge } from "@/components/shared/SentimentBadge";
import { format, parseISO } from "date-fns";

const TOPIC_DESCRIPTIONS: Record<string, string> = {
  pricing: "Mentions related to cost, value, discounts, and price changes.",
  service: "Customer service interactions, help desk, and in-store experience.",
  quality: "Product build quality, materials, and durability feedback.",
  delivery: "Shipping speed, order tracking, and fulfilment issues.",
  support: "Technical support, troubleshooting, and after-sales help.",
  design: "Aesthetic, UX, visual design, and ergonomics.",
  performance: "Speed, reliability, battery life, and technical benchmarks.",
  safety: "Safety concerns, recalls, product hazards, and regulatory issues.",
};

export default function TopicsPage() {
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (selectedBrand === "all") return mentions;
    return mentions.filter((m) => m.brand === selectedBrand);
  }, [selectedBrand]);

  const topicStats = useMemo(() => getTopicStats(filtered), [filtered]);

  const topicMentions = useMemo(() => {
    if (!selectedTopic) return [];
    return filtered
      .filter((m) => m.topics.includes(selectedTopic as any))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 8);
  }, [selectedTopic, filtered]);

  const radarData = topicStats.map((t) => ({
    topic: t.topic,
    negative: t.negative,
    positive: t.positive,
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Topic Analysis</h1>
          <p className="text-sm text-muted-foreground mt-0.5">What users are praising and criticizing</p>
        </div>
        <Select value={selectedBrand} onValueChange={(v) => setSelectedBrand(v ?? "all")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {trackedBrands.map((b) => (
              <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Mentions by Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topicStats} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="topic" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="positive" stackId="a" fill="#10b981" name="Positive" radius={[0, 0, 0, 0]} />
                <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" />
                <Bar dataKey="neutral" stackId="a" fill="#94a3b8" name="Neutral" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Positive vs Negative by Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                <Radar name="Positive" dataKey="positive" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                <Radar name="Negative" dataKey="negative" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Topic Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {topicStats.map((t) => {
          const negPct = t.total > 0 ? Math.round((t.negative / t.total) * 100) : 0;
          const isSelected = selectedTopic === t.topic;
          return (
            <button
              key={t.topic}
              onClick={() => setSelectedTopic(isSelected ? null : t.topic)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                isSelected ? "border-blue-500 bg-blue-50" : "border-transparent bg-white hover:border-slate-200"
              } shadow-sm`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold capitalize">{t.topic}</span>
                <Badge variant="outline" className={`text-xs ${negPct > 40 ? "border-red-300 text-red-700" : "border-emerald-300 text-emerald-700"}`}>
                  {negPct}% neg
                </Badge>
              </div>
              <p className="text-2xl font-bold text-slate-800">{t.total}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t.positive}↑ {t.negative}↓ {t.neutral}→</p>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400 rounded-full"
                  style={{ width: `${negPct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Topic Drill-down */}
      {selectedTopic && topicMentions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold capitalize">Top Mentions: #{selectedTopic}</CardTitle>
              <Badge variant="outline" className="text-xs">{topicMentions.length} shown</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">{TOPIC_DESCRIPTIONS[selectedTopic]}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {topicMentions.map((m) => (
              <Link key={m.id} href={`/mentions/${m.id}`} className="block">
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                  <SentimentBadge sentiment={m.sentiment} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium text-slate-700">{m.brand}</span>
                      <span className="text-xs text-slate-400">{m.source}</span>
                      <span className="text-xs text-slate-400">{m.engagement.toLocaleString()} engagements</span>
                    </div>
                    <p className="text-sm text-slate-700">{m.text}</p>
                    <p className="text-xs text-slate-400 mt-1">{m.author} · {format(parseISO(m.timestamp), "MMM d, yyyy")}</p>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
