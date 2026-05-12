"use client";

import { Badge } from "@/components/ui/badge";
import { Sentiment } from "@/data/mentions";

const config: Record<Sentiment, { label: string; className: string }> = {
  positive: { label: "Positive", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200" },
  negative: { label: "Negative", className: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200" },
  neutral: { label: "Neutral", className: "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200" },
  unclassified: { label: "Unclassified", className: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200" },
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const { label, className } = config[sentiment];
  return (
    <Badge variant="outline" className={`text-xs font-medium ${className}`}>
      {label}
    </Badge>
  );
}
