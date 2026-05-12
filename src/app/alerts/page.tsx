"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateAlerts, Alert } from "@/lib/alerts";
import mentions from "@/data/mentions";
import { SentimentBadge } from "@/components/shared/SentimentBadge";
import { AlertTriangle, TrendingUp, Activity, ExternalLink } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

const SEVERITY_CONFIG = {
  critical: { label: "Critical", className: "bg-red-600 text-white border-red-600", border: "border-l-red-600" },
  high: { label: "High", className: "bg-orange-500 text-white border-orange-500", border: "border-l-orange-500" },
  medium: { label: "Medium", className: "bg-amber-400 text-amber-900 border-amber-400", border: "border-l-amber-400" },
  low: { label: "Low", className: "bg-slate-200 text-slate-700 border-slate-200", border: "border-l-slate-300" },
};

const TYPE_ICONS = {
  crisis: <AlertTriangle className="w-5 h-5 text-red-600" />,
  negative_spike: <TrendingUp className="w-5 h-5 text-orange-500" />,
  volume_spike: <Activity className="w-5 h-5 text-amber-500" />,
};

const TYPE_LABELS = {
  crisis: "Crisis Signal",
  negative_spike: "Negative Spike",
  volume_spike: "Volume Spike",
};

export default function AlertsPage() {
  const alerts = useMemo(() => generateAlerts(), []);

  const critical = alerts.filter((a) => a.severity === "critical");
  const high = alerts.filter((a) => a.severity === "high");
  const medium = alerts.filter((a) => a.severity === "medium");

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Alerts Center</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {alerts.length} active alert{alerts.length !== 1 ? "s" : ""} · Anomaly detection based on 7-day baseline
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-600">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">Critical</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{critical.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">High</p>
            <p className="text-3xl font-bold text-orange-500 mt-1">{high.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">Medium</p>
            <p className="text-3xl font-bold text-amber-500 mt-1">{medium.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert List */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No active alerts. All systems normal.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const { border } = SEVERITY_CONFIG[alert.severity];
            const relatedMentions = mentions.filter((m) => alert.relatedMentionIds.includes(m.id));

            return (
              <Card key={alert.id} className={`border-l-4 ${border}`}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-0.5">{TYPE_ICONS[alert.type]}</div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">{alert.title}</span>
                        <Badge variant="outline" className={`text-xs ${SEVERITY_CONFIG[alert.severity].className}`}>
                          {SEVERITY_CONFIG[alert.severity].label}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-slate-600">
                          {TYPE_LABELS[alert.type]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{alert.brand}</Badge>
                      </div>

                      <p className="text-sm text-slate-700">{alert.description}</p>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Triggered: {format(parseISO(alert.timestamp), "MMM d, yyyy HH:mm")}</span>
                        <span>{alert.mentionCount} related mention{alert.mentionCount !== 1 ? "s" : ""}</span>
                      </div>

                      {/* Related mentions preview */}
                      {relatedMentions.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                          <p className="text-xs font-medium text-slate-600">Flagged mentions:</p>
                          {relatedMentions.slice(0, 3).map((m) => (
                            <Link key={m.id} href={`/mentions/${m.id}`} className="flex items-start gap-2 hover:bg-white rounded p-1.5 transition-colors">
                              <SentimentBadge sentiment={m.sentiment} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-700 line-clamp-1">{m.text}</p>
                                <p className="text-xs text-slate-400">{m.source} · {m.author} · {format(parseISO(m.timestamp), "MMM d, HH:mm")}</p>
                              </div>
                              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            </Link>
                          ))}
                          {relatedMentions.length > 3 && (
                            <Link href={`/mentions?brand=${alert.brand}&sentiment=negative`} className="text-xs text-blue-600 hover:underline block">
                              View all {relatedMentions.length} mentions →
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Alert Logic Info */}
      <Card className="bg-slate-50 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Alert Logic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-xs text-slate-600">
          <p>• <strong>Crisis Signal:</strong> Mention flagged as containing crisis-risk language (boycott calls, safety concerns, urgent escalation).</p>
          <p>• <strong>Negative Spike:</strong> Negative mentions in last 24h exceed 2× the 7-day daily average with at least 3 occurrences.</p>
          <p>• <strong>Volume Spike:</strong> Total mentions in last 24h exceed 3× the 7-day daily average with at least 5 occurrences.</p>
        </CardContent>
      </Card>
    </div>
  );
}
