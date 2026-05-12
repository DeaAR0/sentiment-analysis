import { Mention } from "@/data/mentions";
import { format, parseISO } from "date-fns";

export function exportToCSV(data: Mention[], filename = "mentions-export.csv") {
  const headers = [
    "ID", "Brand", "Source", "Author", "Text", "Timestamp",
    "Region", "Language", "Sentiment", "Confidence", "Topics",
    "Priority", "Status", "Engagement",
  ];

  const rows = data.map((m) => [
    m.id,
    m.brand,
    m.source,
    m.author,
    `"${m.text.replace(/"/g, '""')}"`,
    m.timestamp,
    m.region,
    m.language,
    m.sentiment,
    m.confidence.toFixed(2),
    m.topics.join(";"),
    m.priority,
    m.status,
    m.engagement,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(data: Mention[], title = "SentinelAI — Mention Report") {
  const now = format(new Date(), "MMM d, yyyy HH:mm");

  const sentimentCounts = {
    positive: data.filter((m) => m.sentiment === "positive").length,
    negative: data.filter((m) => m.sentiment === "negative").length,
    neutral: data.filter((m) => m.sentiment === "neutral").length,
    unclassified: data.filter((m) => m.sentiment === "unclassified").length,
  };

  const rows = data.slice(0, 100).map((m) => `
    <tr style="border-bottom:1px solid #e2e8f0">
      <td style="padding:8px 6px;font-size:11px;color:#475569">${format(parseISO(m.timestamp), "MMM d, HH:mm")}</td>
      <td style="padding:8px 6px;font-size:11px;font-weight:600">${m.brand}</td>
      <td style="padding:8px 6px;font-size:11px;color:#64748b">${m.source}</td>
      <td style="padding:8px 6px;font-size:11px;max-width:300px">${m.text.slice(0, 100)}${m.text.length > 100 ? "..." : ""}</td>
      <td style="padding:8px 6px">
        <span style="font-size:10px;padding:2px 8px;border-radius:999px;font-weight:600;background:${
          m.sentiment === "positive" ? "#d1fae5" :
          m.sentiment === "negative" ? "#fee2e2" :
          m.sentiment === "neutral"  ? "#f1f5f9" : "#fef3c7"
        };color:${
          m.sentiment === "positive" ? "#065f46" :
          m.sentiment === "negative" ? "#991b1b" :
          m.sentiment === "neutral"  ? "#475569" : "#92400e"
        }">${m.sentiment}</span>
      </td>
      <td style="padding:8px 6px;font-size:11px;color:#64748b">${m.topics.join(", ")}</td>
      <td style="padding:8px 6px">
        <span style="font-size:10px;padding:2px 8px;border-radius:999px;font-weight:600;background:${
          m.priority === "critical" ? "#dc2626" :
          m.priority === "high" ? "#ea580c" :
          m.priority === "medium" ? "#d97706" : "#e2e8f0"
        };color:${m.priority === "low" ? "#475569" : "#fff"}">${m.priority}</span>
      </td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 32px; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8fafc; padding: 10px 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; text-align: left; border-bottom: 2px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <h1 style="font-size:22px;font-weight:700;margin:0">${title}</h1>
            <p style="color:#64748b;font-size:13px;margin:4px 0 0">Generated ${now} · ${data.length} mentions</p>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px">
        ${Object.entries(sentimentCounts).map(([k, v]) => `
          <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px">
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin:0">${k}</p>
            <p style="font-size:28px;font-weight:700;margin:4px 0 0">${v}</p>
            <p style="font-size:11px;color:#94a3b8;margin:2px 0 0">${data.length > 0 ? Math.round((v / data.length) * 100) : 0}% of total</p>
          </div>
        `).join("")}
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th><th>Brand</th><th>Source</th><th>Mention</th><th>Sentiment</th><th>Topics</th><th>Priority</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${data.length > 100 ? `<p style="font-size:12px;color:#94a3b8;margin-top:12px">Showing first 100 of ${data.length} mentions. Export CSV for full dataset.</p>` : ""}
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      win.print();
      URL.revokeObjectURL(url);
    };
  }
}
