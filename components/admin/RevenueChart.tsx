"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatINR } from "@/lib/utils/formatters";
import type { RevenueDataPoint, FacilityUsageData, BookingStatusData } from "@/types";

// ── Revenue Trend Chart ──────────────────────────────────
interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h3 className="font-medium text-stone-900 mb-4">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#08428C" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#08428C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0ede9" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "#78716c" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
          />
          <Tooltip
            formatter={(v: unknown) => [formatINR(v as number), "Revenue"]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4", fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#08428C"
            strokeWidth={2}
            fill="url(#revenueGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Facility Usage Pie Chart ─────────────────────────────
interface FacilityPieChartProps {
  data: FacilityUsageData[];
}

const PIE_COLORS = ["#08428C", "#5C6795", "#849fce", "#16a34a", "#8b5cf6", "#64748b"];

export function FacilityPieChart({ data }: FacilityPieChartProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h3 className="font-medium text-stone-900 mb-4">Facility Usage</h3>
      {data.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-stone-400 text-sm">
          No booking data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4", fontSize: 12 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── Booking Status Bar Chart ─────────────────────────────
interface BookingStatusChartProps {
  data: BookingStatusData[];
}

const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: "#f59e0b",
  pending_approval: "#3b82f6",
  confirmed: "#22c55e",
  rejected: "#ef4444",
  cancelled: "#78716c",
  completed: "#8b5cf6",
  expired: "#a8a29e",
};

export function BookingStatusChart({ data }: BookingStatusChartProps) {
  const chartData = data.map((d) => ({
    name: d.status.replace(/_/g, " "),
    count: d.count,
    fill: STATUS_COLORS[d.status] ?? "#78716c",
  }));

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h3 className="font-medium text-stone-900 mb-4">Booking Status Distribution</h3>
      {chartData.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-stone-400 text-sm">
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede9" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#78716c" }}
              axisLine={false}
              tickLine={false}
              angle={-30}
              textAnchor="end"
            />
            <YAxis tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4", fontSize: 12 }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
