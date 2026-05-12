"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackedBrands } from "@/data/mentions";
import { Plus, Trash2, Tag, Globe, Bell, CheckCircle2, Info, Hash, Users, Megaphone } from "lucide-react";

const CHANNEL_OPTIONS = ["Twitter", "Reddit", "Forum", "News", "Blog", "Review"];
const TRACKING_TYPES = ["Brand", "Competitor", "Campaign", "Hashtag", "Keyword"] as const;
type TrackingType = typeof TRACKING_TYPES[number];

const TYPE_ICONS: Record<TrackingType, React.ReactNode> = {
  Brand:      <span className="text-xs font-bold">B</span>,
  Competitor: <Users className="w-3 h-3" />,
  Campaign:   <Megaphone className="w-3 h-3" />,
  Hashtag:    <Hash className="w-3 h-3" />,
  Keyword:    <Tag className="w-3 h-3" />,
};

const TYPE_COLORS: Record<TrackingType, string> = {
  Brand:      "bg-blue-100 text-blue-800 border-blue-200",
  Competitor: "bg-red-100 text-red-800 border-red-200",
  Campaign:   "bg-purple-100 text-purple-800 border-purple-200",
  Hashtag:    "bg-emerald-100 text-emerald-800 border-emerald-200",
  Keyword:    "bg-amber-100 text-amber-800 border-amber-200",
};

interface TrackedItem {
  id: string;
  name: string;
  type: TrackingType;
  keywords: string[];
  color: string;
  channels: string[];
  regions: string[];
  languages: string[];
}

const DEFAULT_COMPETITORS: TrackedItem[] = [
  {
    id: "adidas",
    name: "Adidas",
    type: "Competitor",
    keywords: ["Adidas", "#Adidas", "adidas shoes"],
    color: "#ef4444",
    channels: ["Twitter", "Reddit", "News"],
    regions: ["US", "UK", "Global"],
    languages: ["English"],
  },
];

const DEFAULT_CAMPAIGNS: TrackedItem[] = [
  {
    id: "justdoit-2025",
    name: "#JustDoIt 2025",
    type: "Campaign",
    keywords: ["#JustDoIt", "JustDoIt2025"],
    color: "#8b5cf6",
    channels: ["Twitter", "Reddit", "Forum"],
    regions: ["Global"],
    languages: ["English"],
  },
];

export default function SetupPage() {
  const [items, setItems] = useState<TrackedItem[]>([
    ...trackedBrands.map((b) => ({
      ...b,
      type: "Brand" as TrackingType,
      channels: ["Twitter", "Reddit", "Forum", "News", "Blog", "Review"],
      regions: ["US", "UK", "Global"],
      languages: ["English"],
    })),
    ...DEFAULT_COMPETITORS,
    ...DEFAULT_CAMPAIGNS,
  ]);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<TrackingType>("Brand");
  const [saved, setSaved] = useState(false);

  const addItem = () => {
    if (!newName.trim()) return;
    const name = newName.trim();
    setItems((prev) => [
      ...prev,
      {
        id: name.toLowerCase().replace(/\s+/g, "-").replace(/#/g, ""),
        name,
        type: newType,
        keywords: [name],
        color: "#64748b",
        channels: ["Twitter", "Reddit", "News"],
        regions: ["Global"],
        languages: ["English"],
      },
    ]);
    setNewName("");
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const toggleChannel = (id: string, channel: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, channels: i.channels.includes(channel) ? i.channels.filter((c) => c !== channel) : [...i.channels, channel] }
          : i
      )
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const groupedItems = TRACKING_TYPES.reduce((acc, type) => {
    acc[type] = items.filter((i) => i.type === type);
    return acc;
  }, {} as Record<TrackingType, TrackedItem[]>);

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Monitoring Setup</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure tracked brands, competitors, campaigns, hashtags, and keywords</p>
      </div>

      {/* Add New */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Add Tracking Target</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Select value={newType} onValueChange={(v) => setNewType((v ?? "Brand") as TrackingType)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRACKING_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder={
                newType === "Hashtag" ? "#hashtag" :
                newType === "Campaign" ? "Campaign name..." :
                newType === "Competitor" ? "Competitor brand..." :
                newType === "Keyword" ? "keyword or phrase..." :
                "Brand name..."
              }
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              className="flex-1"
            />
            <Button onClick={addItem} className="gap-2">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Examples: Nike (Brand) · Adidas (Competitor) · #SummerCampaign (Hashtag) · "product launch" (Keyword)
          </p>
        </CardContent>
      </Card>

      {/* Tracked Items grouped by type */}
      {TRACKING_TYPES.map((type) => {
        const typeItems = groupedItems[type];
        if (typeItems.length === 0) return null;
        return (
          <div key={type} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs gap-1 ${TYPE_COLORS[type]}`}>
                {TYPE_ICONS[type]} {type}s
              </Badge>
              <span className="text-xs text-muted-foreground">{typeItems.length} tracked</span>
            </div>

            {typeItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-900">{item.name}</span>
                      <Badge variant="outline" className="text-xs">{item.channels.length} channels</Badge>
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Keywords */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      <Tag className="w-3 h-3" /> Keywords
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.keywords.map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Channels */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      <Globe className="w-3 h-3" /> Channels
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {CHANNEL_OPTIONS.map((ch) => (
                        <button
                          key={ch}
                          onClick={() => toggleChannel(item.id, ch)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            item.channels.includes(ch)
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                          }`}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Regions + Languages */}
                  <div className="flex gap-6">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <Globe className="w-3 h-3" /> Regions
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.regions.map((r) => <Badge key={r} variant="outline" className="text-xs">{r}</Badge>)}
                      </div>
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <Bell className="w-3 h-3" /> Languages
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.languages.map((l) => <Badge key={l} variant="outline" className="text-xs">{l}</Badge>)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}

      <Separator />

      {/* Alert Thresholds */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Alert Thresholds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Negative Spike Multiplier</label>
              <Input defaultValue="2" type="number" min={1} className="w-full" />
              <p className="text-xs text-slate-400">Trigger when negative mentions exceed N× daily average</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Volume Spike Multiplier</label>
              <Input defaultValue="3" type="number" min={1} className="w-full" />
              <p className="text-xs text-slate-400">Trigger when total mentions exceed N× daily average</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
        <p>
          Prototype configuration panel. In production, changes here update monitoring subscriptions, re-run ingestion pipelines via N8N, and persist to a database.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2 px-8">
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
