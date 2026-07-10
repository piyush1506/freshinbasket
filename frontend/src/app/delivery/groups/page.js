"use client";

import { useState, useEffect } from "react";
import { getAccessToken } from "@/lib/auth";
import { Layers, Package, CheckCircle2, XCircle, DollarSign, Calendar, ChevronDown, ChevronUp } from "lucide-react";

export default function GroupsPage() {
  const [groupsData, setGroupsData] = useState({ active_groups: [], past_groups: [] });
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [activeTab, setActiveTab] = useState("Active");

  const fetchGroups = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/delivery/groups/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setGroupsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading groups...</p>
        </div>
      </div>
    );
  }

  const displayedGroups = activeTab === "Active" ? groupsData.active_groups : groupsData.past_groups;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Delivery Groups</h1>
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 p-1.5 rounded-full flex overflow-x-auto no-scrollbar w-fit">
        {["Active", "Past"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-8 py-2.5 rounded-full text-sm font-bold transition-all
              ${activeTab === tab 
                ? "bg-white text-[#2D6A2E] shadow-sm" 
                : "text-gray-500 hover:text-gray-700"}
            `}
          >
            {tab} Groups
          </button>
        ))}
      </div>

      {/* Groups List */}
      <div className="space-y-4">
        {displayedGroups.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <Layers size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No {activeTab.toLowerCase()} groups found.</p>
          </div>
        ) : (
          displayedGroups.map((group) => {
            const isExpanded = !!expandedGroups[group.group_id];
            
            return (
              <div key={group.group_id} className={`bg-white rounded-2xl border transition-all ${isExpanded ? 'border-green-500 shadow-md ring-4 ring-green-50' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
                {/* Group Header (Clickable) */}
                <div 
                  className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  onClick={() => toggleGroup(group.group_id)}
                >
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      {group.group_name}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${activeTab === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {activeTab}
                      </span>
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(group.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-gray-400" />
                        {group.delivery_slot}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Stats Badges */}
                    <div className="flex gap-2">
                      <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100 min-w-[70px]">
                        <span className="text-lg font-bold text-gray-700">{group.total_orders}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1"><Package size={10}/> Total</span>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-green-50 rounded-lg px-3 py-1.5 border border-green-100 min-w-[70px]">
                        <span className="text-lg font-bold text-green-700">{group.delivered_count}</span>
                        <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={10}/> Done</span>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-100 min-w-[70px]">
                        <span className="text-lg font-bold text-amber-600">₹{group.cod_collected.toFixed(0)}</span>
                        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1"><DollarSign size={10}/> COD</span>
                      </div>
                    </div>
                    {/* Expand Icon */}
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Content (Orders) */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5 sm:p-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Orders in this group ({group.orders.length})</h4>
                    <div className="space-y-3">
                      {group.orders.map((order) => {
                        let statusColor = "bg-gray-100 text-gray-700";
                        if (order.status === 'DELIVERED') statusColor = "bg-green-100 text-green-700";
                        if (order.status === 'UNDELIVERED') statusColor = "bg-red-100 text-red-700";
                        if (order.status === 'OUT_FOR_DELIVERY') statusColor = "bg-blue-100 text-blue-700";

                        return (
                          <div key={order.order_id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div>
                              <p className="font-bold text-gray-900">#{order.order_number}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{order.customer_name} • {order.payment_method}</p>
                            </div>
                            <div className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${statusColor}`}>
                              {order.status}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
