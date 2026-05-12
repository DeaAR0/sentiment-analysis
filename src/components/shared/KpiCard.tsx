"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  accent?: "default" | "positive" | "negative" | "warning";
}

export function KpiCard({ title, value, subtitle, change, changeLabel, icon, accent = "default" }: KpiCardProps) {
  const accentBorder = {
    default: "border-l-slate-300",
    positive: "border-l-emerald-500",
    negative: "border-l-red-500",
    warning: "border-l-amber-500",
  }[accent];

  return (
    <Card className={cn("border-l-4", accentBorder)}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            {change !== undefined && (
              <div className={cn("flex items-center gap-1 mt-1.5 text-xs font-medium",
                change > 0 ? "text-red-600" : change < 0 ? "text-emerald-600" : "text-slate-500"
              )}>
                {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {change > 0 ? "+" : ""}{change}% {changeLabel ?? "vs last week"}
              </div>
            )}
          </div>
          {icon && (
            <div className="text-muted-foreground shrink-0">{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
