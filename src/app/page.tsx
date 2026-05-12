"use client";

import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/shared/KpiCard";
import { SentimentBadge } from "@/components/shared/SentimentBadge";
import { getKpis, getDailyTrends, getWeeklyTrends, getSourceBreakdown } from "@/lib/analytics";
import { generateAlerts } from "@/lib/alerts";
import mentions, { trackedBrands } from "@/data/mentions";
import { AlertTriangle, MessageSquare, TrendingUp, Activity, Zap, FileDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

const PIE_COLORS = ["#10b981", "#ef4444", "#94a3b8", "#f59e0b"];

export default function DashboardPage() {
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [trendView, setTrendView] = useState<"daily" | "weekly">("daily");
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    if (selectedBrand === "all") return mentions;
    return mentions.filter((m) => m.brand === selectedBrand);
  }, [selectedBrand]);

  const kpis = useMemo(() => getKpis(filtered), [filtered]);
  const dailyTrends = useMemo(() => getDailyTrends(filtered, 30), [filtered]);
  const weeklyTrends = useMemo(() => getWeeklyTrends(filtered, 4), [filtered]);
  const trends = (trendView === "daily" ? dailyTrends : weeklyTrends) as Array<Record<string, any>>;
  const trendKey = trendView === "daily" ? "date" : "week";
  const sourceStats = useMemo(() => getSourceBreakdown(filtered), [filtered]);
  const alerts = useMemo(() => generateAlerts(), []);

  const pieData = [
    { name: "Positive", value: kpis.positive },
    { name: "Negative", value: kpis.negative },
    { name: "Neutral", value: kpis.neutral },
    { name: "Unclassified", value: kpis.unclassified },
  ].filter((d) => d.value > 0);

  const recentMentions = filtered.slice(0, 5);
  const brandLabel = selectedBrand === "all" ? "All Brands" : selectedBrand;

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { exportDashboardToPDF } = await import("@/lib/exportDashboard");
      await exportDashboardToPDF(brandLabel);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      {/* ── SCREEN LAYOUT ─────────────────────────────────────── */}
      <div className="print:hidden p-6 space-y-6 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Brand intelligence overview — last 30 days</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedBrand} onValueChange={(v) => setSelectedBrand(v ?? "all")}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All brands" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {trackedBrands.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting} className="gap-2">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {exporting ? "Exporting..." : "Export PDF"}
            </Button>
          </div>
        </div>

        {/* Crisis Banner */}
        {alerts.filter((a) => a.type === "crisis").length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-800">
                {alerts.filter((a) => a.type === "crisis").length} crisis signal(s) detected
              </p>
              <p className="text-xs text-red-600 truncate">
                {alerts.filter((a) => a.type === "crisis").map((a) => a.brand).join(", ")} — immediate review recommended
              </p>
            </div>
            <Link href="/alerts" className="text-xs font-medium text-red-700 underline shrink-0">View Alerts</Link>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard title="Total Mentions" value={kpis.totalMentions.toLocaleString()} change={kpis.velocityChange} icon={<MessageSquare className="w-5 h-5" />} />
          <KpiCard title="Positive" value={`${kpis.positivePercent}%`} subtitle={`${kpis.positive} mentions`} accent="positive" icon={<TrendingUp className="w-5 h-5" />} />
          <KpiCard title="Negative Share" value={`${kpis.negativePercent}%`} subtitle={`${kpis.negative} mentions`} change={kpis.negativeShareChange} accent="negative" icon={<AlertTriangle className="w-5 h-5" />} />
          <KpiCard title="Mention Velocity" value={`${kpis.velocityChange > 0 ? "+" : ""}${kpis.velocityChange}%`} subtitle="vs previous 7 days" accent={kpis.velocityChange > 20 ? "warning" : "default"} icon={<Activity className="w-5 h-5" />} />
          <KpiCard title="Anomaly Score" value={`${kpis.anomalyScore}/100`} subtitle={kpis.anomalyScore > 60 ? "High risk" : kpis.anomalyScore > 30 ? "Elevated" : "Normal"} accent={kpis.anomalyScore > 60 ? "negative" : kpis.anomalyScore > 30 ? "warning" : "positive"} icon={<Zap className="w-5 h-5" />} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Sentiment Trend — {trendView === "daily" ? "30 Days" : "4 Weeks"}</CardTitle>
              <div className="flex rounded-lg border overflow-hidden text-xs">
                <button onClick={() => setTrendView("daily")} className={`px-3 py-1 transition-colors ${trendView === "daily" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>Daily</button>
                <button onClick={() => setTrendView("weekly")} className={`px-3 py-1 transition-colors ${trendView === "weekly" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>Weekly</button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trends} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey={trendKey} tick={{ fontSize: 10 }} tickLine={false} interval={trendView === "daily" ? 4 : 0} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="neutral" stroke="#94a3b8" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Sentiment Split</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Mentions by Source</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sourceStats} layout="vertical" margin={{ top: 0, right: 8, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} tickLine={false} width={55} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="positive" stackId="a" fill="#10b981" name="Positive" />
                  <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Mentions</CardTitle>
              <Link href="/mentions" className="text-xs text-blue-600 hover:underline">View all</Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentMentions.map((m) => (
                <Link key={m.id} href={`/mentions/${m.id}`} className="block">
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-medium text-slate-700">{m.brand}</span>
                        <span className="text-xs text-slate-400">{m.source}</span>
                        <SentimentBadge sentiment={m.sentiment} />
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{m.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{format(parseISO(m.timestamp), "MMM d, HH:mm")} · {m.author}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── PRINT LAYOUT ──────────────────────────────────────── */}
      {/* hidden on screen, only visible when printing */}
      <div className="hidden print:block" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "0 12px", color: "#1e293b" }}>

        {/* Report Header */}
        <div style={{ borderBottom: "2px solid #1e293b", paddingBottom: 8, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>SentinelAI</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginTop: 2 }}>Brand Intelligence Report — {brandLabel}</div>
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "right" }}>
              <div>Generated {format(new Date(), "MMM d, yyyy HH:mm")}</div>
              <div>Last 30 days · {filtered.length} mentions</div>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 14 }}>
          {[
            { label: "Total Mentions", value: kpis.totalMentions, sub: `${kpis.velocityChange > 0 ? "+" : ""}${kpis.velocityChange}% vs last week`, color: "#1e293b" },
            { label: "Positive", value: `${kpis.positivePercent}%`, sub: `${kpis.positive} mentions`, color: "#10b981" },
            { label: "Negative Share", value: `${kpis.negativePercent}%`, sub: `${kpis.negative} mentions`, color: "#ef4444" },
            { label: "Mention Velocity", value: `${kpis.velocityChange > 0 ? "+" : ""}${kpis.velocityChange}%`, sub: "vs prev 7 days", color: "#f59e0b" },
            { label: "Anomaly Score", value: `${kpis.anomalyScore}/100`, sub: kpis.anomalyScore > 60 ? "High risk" : kpis.anomalyScore > 30 ? "Elevated" : "Normal", color: kpis.anomalyScore > 60 ? "#ef4444" : kpis.anomalyScore > 30 ? "#f59e0b" : "#10b981" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "8px 10px", borderTop: `3px solid ${color}` }}>
              <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Trend Chart — full width, fixed px so it renders when parent is hidden */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Sentiment Trend — 30 Days</div>
          <LineChart width={740} height={160} data={dailyTrends} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 8 }} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 8 }} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 10 }} />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={1.5} dot={false} name="Positive" />
            <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Negative" />
            <Line type="monotone" dataKey="neutral" stroke="#94a3b8" strokeWidth={1} dot={false} strokeDasharray="4 2" name="Neutral" />
          </LineChart>
        </div>

        {/* Pie + Bar side by side — fixed px */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Sentiment Split</div>
            <PieChart width={340} height={170}>
              <Pie data={pieData} cx="50%" cy="45%" innerRadius={42} outerRadius={68} paddingAngle={2} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
            </PieChart>
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Mentions by Source</div>
            <BarChart width={340} height={170} data={sourceStats.filter(s => s.total > 0)} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 8 }} tickLine={false} />
              <YAxis type="category" dataKey="source" tick={{ fontSize: 9 }} tickLine={false} width={45} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Bar dataKey="positive" stackId="a" fill="#10b981" name="Positive" />
              <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" />
              <Legend wrapperStyle={{ fontSize: 9 }} />
            </BarChart>
          </div>
        </div>

        {/* Recent Mentions Table */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Recent Mentions</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "4px 8px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "4px 8px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Brand</th>
                <th style={{ padding: "4px 8px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Source</th>
                <th style={{ padding: "4px 8px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Mention</th>
                <th style={{ padding: "4px 8px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 10).map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "4px 8px", whiteSpace: "nowrap", color: "#64748b" }}>{format(parseISO(m.timestamp), "MMM d")}</td>
                  <td style={{ padding: "4px 8px", fontWeight: 600 }}>{m.brand}</td>
                  <td style={{ padding: "4px 8px", color: "#64748b" }}>{m.source}</td>
                  <td style={{ padding: "4px 8px", maxWidth: 260 }}>{m.text.slice(0, 90)}{m.text.length > 90 ? "..." : ""}</td>
                  <td style={{ padding: "4px 8px" }}>
                    <span style={{
                      fontSize: 8, padding: "2px 6px", borderRadius: 999, fontWeight: 600,
                      background: m.sentiment === "positive" ? "#d1fae5" : m.sentiment === "negative" ? "#fee2e2" : "#f1f5f9",
                      color: m.sentiment === "positive" ? "#065f46" : m.sentiment === "negative" ? "#991b1b" : "#475569",
                    }}>{m.sentiment}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 12, borderTop: "1px solid #e2e8f0", paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 8, color: "#94a3b8" }}>
          <span>SentinelAI — Brand Intelligence Platform · Prototype v1.0</span>
          <span>Powered by HuggingFace RoBERTa · cardiffnlp/twitter-roberta-base-sentiment-latest</span>
        </div>
      </div>
    </>
  );
}
