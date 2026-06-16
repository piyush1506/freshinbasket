"use client";

import { useState, useEffect } from "react";
import { getAccessToken } from "@/lib/auth";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  Bike,
  Clock,
  Target,
  Wallet,
  IndianRupee,
} from "lucide-react";

export default function EarningsPage() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week"); // week, month, all

  useEffect(() => {
    const fetchEarnings = async () => {
      const token = getAccessToken();
      if (!token) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/delivery/earnings/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setEarnings(data);
        }
      } catch (err) {
        console.error("Failed to fetch earnings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  // Demo earnings data
  const demoEarnings = {
    commission_per_delivery: 30.0,
    daily_breakdown: [
      { date: "2024-10-18", day_name: "Mon", deliveries: 5, earnings: 150 },
      { date: "2024-10-19", day_name: "Tue", deliveries: 3, earnings: 90 },
      { date: "2024-10-20", day_name: "Wed", deliveries: 7, earnings: 210 },
      { date: "2024-10-21", day_name: "Thu", deliveries: 4, earnings: 120 },
      { date: "2024-10-22", day_name: "Fri", deliveries: 8, earnings: 240 },
      { date: "2024-10-23", day_name: "Sat", deliveries: 6, earnings: 180 },
      { date: "2024-10-24", day_name: "Sun", deliveries: 3, earnings: 90 },
    ],
    this_month: { deliveries: 89, earnings: 2670 },
    all_time: { deliveries: 342, earnings: 10260 },
  };

  const data = earnings || demoEarnings;
  const weekTotal = data.daily_breakdown.reduce(
    (sum, d) => sum + d.earnings,
    0
  );
  const weekDeliveries = data.daily_breakdown.reduce(
    (sum, d) => sum + d.deliveries,
    0
  );
  const maxDayEarning = Math.max(
    ...data.daily_breakdown.map((d) => d.earnings)
  );
  const bestDay = data.daily_breakdown.find(
    (d) => d.earnings === maxDayEarning
  );

  // Build recent transactions from API daily breakdown
  const recentTransactions = data.daily_breakdown
    .filter((d) => d.deliveries > 0)
    .slice()
    .reverse()
    .flatMap((d) =>
      Array.from({ length: d.deliveries }, (_, i) => ({
        id: `${d.date}-${i}`,
        type: "delivery",
        order: `#HF-${d.date.replace(/-/g, "").slice(-4)}${String(i + 1).padStart(2, "0")}`,
        customer: "—",
        amount: data.commission_per_delivery,
        date: d.day_name,
        time: "",
      }))
    )
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading earnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Earnings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your income and delivery performance
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors">
            <Download size={15} />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* This Week */}
        <div className="bg-gradient-to-br from-[#2D6A2E] to-emerald-700 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="relative">
            <p className="text-green-200 text-xs font-medium uppercase tracking-wider">
              This Week
            </p>
            <p className="text-3xl font-extrabold mt-2">₹{weekTotal}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <ArrowUpRight size={14} className="text-green-300" />
              <span className="text-green-200 text-xs font-medium">
                +12% from last week
              </span>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Calendar size={18} className="text-blue-600" />
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp size={14} />
              <span className="text-xs font-semibold">+8%</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            This Month
          </p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            ₹{data.this_month.earnings}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.this_month.deliveries} deliveries
          </p>
        </div>

        {/* All Time */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Wallet size={18} className="text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            All Time
          </p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            ₹{data.all_time.earnings.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.all_time.deliveries} deliveries
          </p>
        </div>

        {/* Best Day */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Target size={18} className="text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            Best Day This Week
          </p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            ₹{maxDayEarning}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {bestDay?.day_name} — {bestDay?.deliveries} deliveries
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Breakdown Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Daily Breakdown
            </h3>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {["week", "month"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    period === p
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end gap-3 h-[200px] px-4">
            {data.daily_breakdown.map((day, i) => {
              const height =
                maxDayEarning > 0
                  ? (day.earnings / maxDayEarning) * 100
                  : 0;
              const isHighest = day.earnings === maxDayEarning;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <span className="text-xs font-semibold text-gray-700">
                    ₹{day.earnings}
                  </span>
                  <div
                    className={`w-full rounded-xl transition-all duration-700 ${
                      isHighest
                        ? "bg-gradient-to-t from-[#2D6A2E] to-emerald-400"
                        : "bg-gradient-to-t from-gray-200 to-gray-100"
                    }`}
                    style={{
                      height: `${Math.max(height, 8)}%`,
                    }}
                  ></div>
                  <span
                    className={`text-xs font-medium ${
                      isHighest ? "text-green-700" : "text-gray-400"
                    }`}
                  >
                    {day.day_name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Summary below chart */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-400">Avg per day</p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{Math.round(weekTotal / 7)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Avg per delivery</p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{data.commission_per_delivery}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Week total</p>
              <p className="text-lg font-bold text-green-700">₹{weekTotal}</p>
            </div>
          </div>
        </div>

        {/* Performance Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h3 className="text-lg font-bold text-gray-900">Performance</h3>

          {/* Circular Progress */}
          <div className="flex justify-center py-4">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#2D6A2E"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(weekDeliveries / 40) * 251.2} 251.2`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-extrabold text-gray-900">
                  {weekDeliveries}
                </p>
                <p className="text-[11px] text-gray-400 font-medium">
                  of 40 goal
                </p>
              </div>
            </div>
          </div>

          {/* Stats List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Bike size={14} className="text-green-600" />
                </div>
                <span className="text-sm text-gray-600">Deliveries</span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {weekDeliveries}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock size={14} className="text-blue-600" />
                </div>
                <span className="text-sm text-gray-600">Avg Time</span>
              </div>
              <span className="text-sm font-bold text-gray-900">18 min</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Target size={14} className="text-amber-600" />
                </div>
                <span className="text-sm text-gray-600">On-Time Rate</span>
              </div>
              <span className="text-sm font-bold text-green-700">96%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            Recent Transactions
          </h3>
          <button className="text-sm text-green-700 font-medium hover:text-green-800 transition-colors">
            View All
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === "bonus"
                      ? "bg-amber-100"
                      : "bg-green-100"
                  }`}
                >
                  {tx.type === "bonus" ? (
                    <Target size={16} className="text-amber-600" />
                  ) : (
                    <IndianRupee size={16} className="text-green-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {tx.order}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tx.customer} • {tx.date}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-700">+₹{tx.amount}</p>
                <p className="text-xs text-gray-400">{tx.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
