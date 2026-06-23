"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface SimpleBarChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  bars: { key: string; color: string; label: string }[];
  height?: number;
  layout?: "horizontal" | "vertical";
}

export function SimpleBarChart({ data, xKey, bars, height = 280, layout = "horizontal" }: SimpleBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No data to display yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        {layout === "horizontal" ? (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          </>
        ) : (
          <>
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis dataKey={xKey} type="category" tick={{ fontSize: 12 }} width={90} />
          </>
        )}
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        <Legend />
        {bars.map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} name={bar.label} fill={bar.color} radius={[4, 4, 4, 4]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
