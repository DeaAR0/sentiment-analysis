"use client";

import { useState, use, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SentimentBadge } from "@/components/shared/SentimentBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import mentions, { Priority, Status } from "@/data/mentions";
import {
  ArrowLeft, ExternalLink, Heart,
  AlertTriangle, User, Globe, Calendar, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

const TRIAGE_KEY = "sentinelai_triage";

const SOURCE_ICONS: Record<string, string> = {
  Twitter: "𝕏", Reddit: "🟠", Forum: "💬", News: "📰", Blog: "✍️", Review: "⭐",
};

const TOPIC_COLORS: Record<string, string> = {
  pricing:     "bg-purple-100 text-purple-800",
  service:     "bg-blue-100 text-blue-800",
  quality:     "bg-emerald-100 text-emerald-800",
  delivery:    "bg-orange-100 text-orange-800",
  support:     "bg-cyan-100 text-cyan-800",
  design:      "bg-pink-100 text-pink-800",
  performance: "bg-indigo-100 text-indigo-800",
  safety:      "bg-red-100 text-red-800",
};

function loadTriage(id: string): { priority: Priority; status: Status; notes: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const all = JSON.parse(localStorage.getItem(TRIAGE_KEY) ?? "{}");
    return all[id] ?? null;
  } catch { return null; }
}

function saveTriage(id: string, data: { priority: Priority; status: Status; notes: string }) {
  try {
    const all = JSON.parse(localStorage.getItem(TRIAGE_KEY) ?? "{}");
    all[id] = data;
    localStorage.setItem(TRIAGE_KEY, JSON.stringify(all));
  } catch {}
}

export default function MentionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const original = mentions.find((m) => m.id === id);

  if (!original) notFound();

  const [priority, setPriority] = useState<Priority>(original.priority);
  const [status, setStatus] = useState<Status>(original.status);
  const [notes, setNotes] = useState("");
  const [assignee, setAssignee] = useState("");
  const [saved, setSaved] = useState(false);

  // SLA deadline: critical = 2h, high = 8h, medium = 24h, low = 72h
  const SLA_HOURS: Record<Priority, number> = { critical: 2, high: 8, medium: 24, low: 72 };
  const slaHours = SLA_HOURS[priority];

  // Load persisted triage state on mount
  useEffect(() => {
    const stored = loadTriage(id);
    if (stored) {
      setPriority(stored.priority);
      setStatus(stored.status);
      setNotes(stored.notes);
      setAssignee((stored as any).assignee ?? "");
    }
  }, [id]);

  const handleSave = () => {
    saveTriage(id, { priority, status, notes, assignee } as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const relatedMentions = mentions
    .filter((m) => m.brand === original.brand && m.id !== original.id)
    .slice(0, 4);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <span className="text-sm text-muted-foreground">{original.id}</span>
        {original.isCrisis && (
          <Badge className="bg-red-600 text-white text-xs gap-1">
            <AlertTriangle className="w-3 h-3" /> Crisis Signal
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg">{SOURCE_ICONS[original.source]}</span>
                <span className="font-semibold text-slate-800">{original.source}</span>
                <span className="text-slate-400">·</span>
                <span className="font-medium text-slate-700">{original.brand}</span>
                <SentimentBadge sentiment={original.sentiment} />
                <Badge variant="outline" className="text-xs">
                  {Math.round(original.confidence * 100)}% confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base text-slate-800 leading-relaxed">{original.text}</p>

              <div className="flex flex-wrap gap-2">
                {original.topics.map((topic) => (
                  <span key={topic} className={`text-xs px-2 py-0.5 rounded-full font-medium ${TOPIC_COLORS[topic] ?? "bg-slate-100 text-slate-700"}`}>
                    #{topic}
                  </span>
                ))}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-4 h-4 shrink-0" />
                  <span>{original.author}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>{format(parseISO(original.timestamp), "MMM d, yyyy HH:mm")}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>{original.region} · {original.language.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Heart className="w-4 h-4 shrink-0" />
                  <span>{original.engagement.toLocaleString()} engagements</span>
                </div>
              </div>

              <a href={original.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <ExternalLink className="w-3 h-3" /> View source
              </a>
            </CardContent>
          </Card>

          {/* Related Mentions */}
          {relatedMentions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Other {original.brand} Mentions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {relatedMentions.map((m) => (
                  <Link key={m.id} href={`/mentions/${m.id}`} className="block">
                    <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50">
                      <SentimentBadge sentiment={m.sentiment} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 line-clamp-1">{m.text}</p>
                        <p className="text-xs text-slate-400">{m.source} · {format(parseISO(m.timestamp), "MMM d")}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Triage Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Triage Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Priority</label>
                <Select value={priority} onValueChange={(v) => setPriority((v ?? "low") as Priority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Status</label>
                <Select value={status} onValueChange={(v) => setStatus((v ?? "unreviewed") as Status)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unreviewed">Unreviewed</SelectItem>
                    <SelectItem value="in-review">In Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Assignee</label>
                <Input
                  placeholder="Assign to team member..."
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600">SLA</label>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    priority === "critical" ? "bg-red-100 text-red-700" :
                    priority === "high" ? "bg-orange-100 text-orange-700" :
                    priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    Respond within {slaHours}h
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Follow-up Notes</label>
                <textarea
                  className="w-full text-xs border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-20 bg-white"
                  placeholder="Add follow-up notes, action items..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button onClick={handleSave} className="w-full gap-2" size="sm">
                {saved
                  ? <><CheckCircle2 className="w-4 h-4" /> Saved to browser</>
                  : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Current Labels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Sentiment</span>
                <SentimentBadge sentiment={original.sentiment} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Priority</span>
                <PriorityBadge priority={priority} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Status</span>
                <Badge variant="outline" className="text-xs capitalize">{status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Confidence</span>
                <span className="text-xs font-medium">{Math.round(original.confidence * 100)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
