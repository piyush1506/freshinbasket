"use client";

import { useState, useEffect } from "react";
import { getAccessToken } from "@/lib/auth";
import OrderDetailModal from "../../components/OrderDetailModal";
import toast from "react-hot-toast";
import { Search, Bell, MapPin, ShoppingBag, ChevronRight, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("All"); // 'All', 'Active', 'Delivered', 'Undelivered'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchOrders = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/delivery/orders/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusConfig = (status) => {
    switch (status) {
      case "DELIVERED":
        return { label: "Completed", color: "text-green-700", bg: "bg-green-100", icon: CheckCircle2 };
      case "UNDELIVERED":
        return { label: "Undelivered", color: "text-red-700", bg: "bg-red-100", icon: XCircle };
      case "OUT_FOR_DELIVERY":
        return { label: "In Transit", color: "text-blue-700", bg: "bg-blue-100", icon: Clock };
      case "CONFIRMED":
        return { label: "Assigned", color: "text-amber-700", bg: "bg-amber-100", icon: Clock };
      case "PENDING":
        return { label: "Pending", color: "text-orange-700", bg: "bg-orange-100", icon: Clock };
      default:
        return { label: status, color: "text-gray-700", bg: "bg-gray-100", icon: Clock };
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (selectedTab === "Active") {
      return ["CONFIRMED", "OUT_FOR_DELIVERY", "PENDING"].includes(order.status);
    }
    if (selectedTab === "Delivered") return order.status === "DELIVERED";
    if (selectedTab === "Undelivered") return order.status === "UNDELIVERED";
    return true; // All
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Orders</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 text-green-700 hover:bg-green-50 rounded-full transition-colors">
            <Search size={22} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 p-1.5 rounded-full flex overflow-x-auto no-scrollbar">
        {["All", "Active", "Delivered", "Undelivered"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`
              flex-1 whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all
              ${selectedTab === tab 
                ? "bg-white text-[#2D6A2E] shadow-sm" 
                : "text-gray-500 hover:text-gray-700"}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No {selectedTab.toLowerCase()} orders found.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusCfg = getStatusConfig(order.status);
            const StatusIcon = statusCfg.icon;

            return (
              <div key={order.order_id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 sm:p-6">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Order ID</p>
                      <h3 className="text-lg font-bold text-gray-900">#{order.order_number}</h3>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusCfg.bg}`}>
                      <StatusIcon size={14} className={statusCfg.color} />
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-5 flex gap-3 border border-gray-100">
                    <MapPin size={20} className="text-[#2D6A2E] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Delivery Address</p>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">{order.delivery_address}</p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                      <div className="w-8 h-8 rounded-full bg-[#E2F0EC] flex items-center justify-center">
                        <ShoppingBag size={16} className="text-[#2D6A2E]" />
                      </div>
                      <span>{order.items?.length || 0} items</span>
                    </div>
                    
                    <button
                      onClick={() => { setSelectedOrder(order); setIsDetailModalOpen(true); }}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#2D6A2E] text-white text-sm font-semibold rounded-xl hover:bg-[#245824] transition-colors"
                    >
                      View Details
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <OrderDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setSelectedOrder(null); fetchOrders(); }}
        order={selectedOrder}
      />
    </div>
  );
}
