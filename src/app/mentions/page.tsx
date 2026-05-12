"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SentimentBadge } from "@/components/shared/SentimentBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { exportToCSV, exportToPDF } from "@/lib/export";
import mentions, { trackedBrands } from "@/data/mentions";
import { Download, Search, AlertTriangle, Bookmark, BookmarkCheck, X, FileText } from "lucide-react";
import Link from "next/link";
import { format, parseISO, subDays } from "date-fns";

const SOURCE_ICONS: Record<string, string> = {
  Twitter: "𝕏",
  Reddit: "🟠",
  Forum: "💬",
  News: "📰",
  Blog: "✍️",
  Review: "⭐",
};

const REGIONS = [...new Set(mentions.map((m) => m.region))].sort();
const LANGUAGES = [...new Set(mentions.map((m) => m.language))].sort();
const DATASET_LATEST = new Date(Math.max(...mentions.map((m) => new Date(m.timestamp).getTime())));

interface SavedFilter {
  name: string;
  filters: Record<string, string>;
}

const STORAGE_KEY = "sentinelai_saved_filters";
const TRIAGE_KEY = "sentinelai_triage";

function loadSavedFilters(): SavedFilter[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}

function saveSavedFilters(filters: SavedFilter[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}

export function loadTriageState(): Record<string, { priority: string; status: string; notes: string }> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(TRIAGE_KEY) ?? "{}"); } catch { return {}; }
}

export default function MentionsPage() {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [sortBy, setSortBy] = useState<"date" | "engagement">("date");
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [triage, setTriage] = useState<Record<string, { priority: string; status: string; notes: string }>>({});

  useEffect(() => {
    setSavedFilters(loadSavedFilters());
    setTriage(loadTriageState());
  }, []);

  const currentFilters = { search, brandFilter, sentimentFilter, sourceFilter, statusFilter, regionFilter, languageFilter, dateRange };

  const hasActiveFilters = Object.entries(currentFilters).some(([k, v]) =>
    k === "dateRange" ? v !== "30" : v !== "" && v !== "all"
  );

  const clearFilters = () => {
    setSearch(""); setBrandFilter("all"); setSentimentFilter("all");
    setSourceFilter("all"); setStatusFilter("all");
    setRegionFilter("all"); setLanguageFilter("all"); setDateRange("30");
  };

  const saveCurrentFilter = () => {
    const name = prompt("Name this saved filter:");
    if (!name?.trim()) return;
    const updated = [...savedFilters, { name: name.trim(), filters: currentFilters }];
    setSavedFilters(updated);
    saveSavedFilters(updated);
  };

  const applyFilter = (f: SavedFilter) => {
    setSearch(f.filters.search ?? "");
    setBrandFilter(f.filters.brandFilter ?? "all");
    setSentimentFilter(f.filters.sentimentFilter ?? "all");
    setSourceFilter(f.filters.sourceFilter ?? "all");
    setStatusFilter(f.filters.statusFilter ?? "all");
    setRegionFilter(f.filters.regionFilter ?? "all");
    setLanguageFilter(f.filters.languageFilter ?? "all");
    setDateRange(f.filters.dateRange ?? "30");
  };

  const deleteFilter = (name: string) => {
    const updated = savedFilters.filter((f) => f.name !== name);
    setSavedFilters(updated);
    saveSavedFilters(updated);
  };

  const filtered = useMemo(() => {
    const cutoff = subDays(DATASET_LATEST, parseInt(dateRange));
    let result = mentions.filter((m) => new Date(m.timestamp) >= cutoff);

    if (search) result = result.filter((m) =>
      m.text.toLowerCase().includes(search.toLowerCase()) ||
      m.author.toLowerCase().includes(search.toLowerCase()) ||
      m.brand.toLowerCase().includes(search.toLowerCase())
    );
    if (brandFilter !== "all") result = result.filter((m) => m.brand === brandFilter);
    if (sentimentFilter !== "all") result = result.filter((m) => m.sentiment === sentimentFilter);
    if (sourceFilter !== "all") result = result.filter((m) => m.source === sourceFilter);
    if (regionFilter !== "all") result = result.filter((m) => m.region === regionFilter);
    if (languageFilter !== "all") result = result.filter((m) => m.language === languageFilter);

    // Merge triage state for status filter
    if (statusFilter !== "all") {
      result = result.filter((m) => {
        const t = triage[m.id];
        const effectiveStatus = t?.status ?? m.status;
        return effectiveStatus === statusFilter;
      });
    }

    if (sortBy === "engagement") result.sort((a, b) => b.engagement - a.engagement);
    return result;
  }, [search, brandFilter, sentimentFilter, sourceFilter, statusFilter, regionFilter, languageFilter, dateRange, sortBy, triage]);

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mentions Feed</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} of {mentions.length} mentions</p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={saveCurrentFilter} className="gap-2">
              <Bookmark className="w-4 h-4" /> Save Filter
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => exportToPDF(filtered)} className="gap-2">
            <FileText className="w-4 h-4" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToCSV(filtered)} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Saved:</span>
          {savedFilters.map((f) => (
            <div key={f.name} className="flex items-center gap-1">
              <button
                onClick={() => applyFilter(f)}
                className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors font-medium"
              >
                <BookmarkCheck className="w-3 h-3 inline mr-1" />{f.name}
              </button>
              <button onClick={() => deleteFilter(f.name)} className="text-slate-400 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          {/* Row 1 */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search mentions, authors, brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={brandFilter} onValueChange={(v) => setBrandFilter(v ?? "all")}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Brand" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {trackedBrands.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sentimentFilter} onValueChange={(v) => setSentimentFilter(v ?? "all")}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Sentiment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="unclassified">Unclassified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v ?? "all")}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {["Twitter", "Reddit", "Forum", "News", "Blog", "Review"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 2 */}
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="unreviewed">Unreviewed</SelectItem>
                <SelectItem value="in-review">In Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={(v) => setRegionFilter(v ?? "all")}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Region" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={languageFilter} onValueChange={(v) => setLanguageFilter(v ?? "all")}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Language" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={(v) => setDateRange(v ?? "30")}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy((v ?? "date") as "date" | "engagement")}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort: Newest</SelectItem>
                <SelectItem value="engagement">Sort: Engagement</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 gap-1">
                <X className="w-3 h-3" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-8"></TableHead>
                <TableHead>Mention</TableHead>
                <TableHead className="w-24">Brand</TableHead>
                <TableHead className="w-24">Source</TableHead>
                <TableHead className="w-28">Sentiment</TableHead>
                <TableHead className="w-24">Priority</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-24">Engagement</TableHead>
                <TableHead className="w-32">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                    No mentions match your filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((m) => {
                const t = triage[m.id];
                const effectivePriority = t?.priority ?? m.priority;
                const effectiveStatus = t?.status ?? m.status;
                return (
                  <TableRow key={m.id} className="hover:bg-slate-50 cursor-pointer">
                    <TableCell className="text-center">
                      {m.isCrisis && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    </TableCell>
                    <TableCell>
                      <Link href={`/mentions/${m.id}`} className="block">
                        <p className="text-sm text-slate-800 line-clamp-2 hover:text-blue-700">{m.text}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{m.author} · {m.region} · {m.language.toUpperCase()}</p>
                      </Link>
                    </TableCell>
                    <TableCell><span className="text-xs font-medium">{m.brand}</span></TableCell>
                    <TableCell><span className="text-sm">{SOURCE_ICONS[m.source]} {m.source}</span></TableCell>
                    <TableCell><SentimentBadge sentiment={m.sentiment} /></TableCell>
                    <TableCell><PriorityBadge priority={effectivePriority as any} /></TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{effectiveStatus}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{m.engagement.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {format(parseISO(m.timestamp), "MMM d, HH:mm")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
