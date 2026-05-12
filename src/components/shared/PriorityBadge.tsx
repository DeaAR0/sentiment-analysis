"use client";

import { Badge } from "@/components/ui/badge";
import { Priority } from "@/data/mentions";

const config: Record<Priority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200" },
  high: { label: "High", className: "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200" },
  critical: { label: "Critical", className: "bg-red-600 text-white hover:bg-red-600 border-red-600" },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, className } = config[priority];
  return (
    <Badge variant="outline" className={`text-xs font-medium ${className}`}>
      {label}
    </Badge>
  );
}
