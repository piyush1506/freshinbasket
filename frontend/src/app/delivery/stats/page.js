"use client";

import { useState, useEffect } from "react";
import { getAccessToken } from "@/lib/auth";
import { BarChart, CheckCircle2, XCircle, DollarSign, ListOrdered } from "lucide-react";

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/delivery/stats/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading statistics...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, data, isPrimary = false }) => (
    <div className={`bg-white rounded-2xl border ${isPrimary ? 'border-green-200 shadow-md ring-4 ring-green-50' : 'border-gray-200'} p-6`}>
      <h3 className={`text-lg font-bold mb-4 ${isPrimary ? 'text-green-800' : 'text-gray-900'}`}>{title}</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600 font-medium">
            <ListOrdered size={16} /> Total Orders
          </div>
          <span className="font-bold text-gray-900">{data.total_orders}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <CheckCircle2 size={16} /> Delivered
          </div>
          <span className="font-bold text-green-700">{data.delivered}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-red-600 font-medium">
            <XCircle size={16} /> Undelivered
          </div>
          <span className="font-bold text-red-700">{data.undelivered}</span>
        </div>
      </div>
      <div className="mt-5 pt-4 border-t border-gray-100">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
          <DollarSign size={14} className="text-amber-600" />
          <span className="text-sm font-bold text-amber-700">₹{data.cod_collected.toFixed(0)} COD</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <BarChart className="text-green-700" size={32} />
          Statistics
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Today" data={stats.today} isPrimary={true} />
        <StatCard title="This Week" data={stats.this_week} />
        <StatCard title="This Month" data={stats.this_month} />
      </div>

      {/* Daily Breakdown */}
      {stats.daily_breakdown && stats.daily_breakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Daily Breakdown</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.daily_breakdown.map((d, i) => (
              <div key={i} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-bold text-gray-900">{d.day}, {d.date}</p>
                  <p className="text-sm text-gray-500 mt-1">Delivered: {d.delivered} / {d.total_orders}</p>
                </div>
                <div className="px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="font-bold text-amber-700">₹{d.cod_collected.toFixed(0)} COD</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Breakdown */}
      {stats.monthly_breakdown && stats.monthly_breakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Monthly Breakdown</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.monthly_breakdown.map((m, i) => (
              <div key={i} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-bold text-gray-900">{m.label}</p>
                  <p className="text-sm text-gray-500 mt-1">Delivered: {m.delivered} / {m.total_orders}</p>
                </div>
                <div className="px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="font-bold text-amber-700">₹{m.cod_collected.toFixed(0)} COD</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
