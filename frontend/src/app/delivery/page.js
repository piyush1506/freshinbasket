"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const DeliveryMap = dynamic(() => import("../components/DeliveryMap"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center text-sm text-gray-500">Loading Map...</div> 
});
import { getAccessToken } from "@/lib/auth";
import toast from "react-hot-toast";
import {
  Truck,
  Navigation,
  Phone,
  MapPin,
  Clock,
  Package,
  TrendingUp,
  Star,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Eye,
  Zap,
} from "lucide-react";

export default function DeliveryDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [driverlocation,setdriverlocation]=useState({lat:0,lng:0})

  const fetchDashboard = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/delivery/dashboard/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedOrders = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/delivery/orders/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setAssignedOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch assigned orders:", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchAssignedOrders();
    const interval = setInterval(() => {
      fetchDashboard();
      fetchAssignedOrders();
    }, 80000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    const token = getAccessToken();
    if (!token) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/delivery/orders/${orderId}/status/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (res.ok) {
        fetchDashboard();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenNavigation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setdriverlocation({ lat: latitude, lng: longitude });
        toast.success("Route created between you and the destination");
      },
      (error) => {
        let msg = "Failed to get location";
        if (error.code === 1) msg = "Location permission denied. Please enable GPS.";
        else if (error.code === 2) msg = "Location unavailable. Try again.";
        else if (error.code === 3) msg = "Location request timed out.";
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const data = dashboard || {
    driver_name: "Driver",
    today_earnings: 0,
    today_deliveries: 0,
    avg_rating: 0,
    active_delivery: null
  };

  // Status badge config
  const statusConfig = {
    CONFIRMED:        { label: "Confirmed",    cls: "bg-blue-100 text-blue-700" },
    OUT_FOR_DELIVERY: { label: "In Transit",   cls: "bg-amber-100 text-amber-700" },
    DELIVERED:        { label: "Delivered",    cls: "bg-green-100 text-green-700" },
    PENDING:          { label: "Pending",      cls: "bg-gray-100 text-gray-600" },
    CANCELLED:        { label: "Cancelled",    cls: "bg-red-100 text-red-700" },
  };

  const scheduleItems = assignedOrders;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-green-800 to-emerald-600 bg-clip-text text-transparent">
              {data.driver_name}
            </span>
          </h1>
          <p className="text-gray-500 mt-1.5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
            You are currently <strong className="text-gray-700">Online</strong>{" "}
            and ready for orders.
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="flex gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-3.5 min-w-[110px]">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
              Deliveries
            </p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
              {data.today_deliveries}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-3.5 min-w-[110px]">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
              Avg Rating
            </p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5 flex items-center gap-1.5">
              <Star
                size={16}
                className="text-amber-500 fill-amber-500"
              />
              {data.avg_rating}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Delivery Card — Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {data.active_delivery ? (
            <>
              {/* Header */}
              <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-green-700 text-white text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={12} />
                    Active Now
                  </span>
                  <h2 className="text-xl font-bold text-gray-900">
                    #{data.active_delivery.order_number} —{" "}
                    <span className="text-gray-500 font-medium text-base">
                      Fresh Veggies Bundle
                    </span>
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenNavigation}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#2D6A2E] text-white text-sm font-semibold rounded-xl hover:bg-[#245824] transition-all shadow-lg shadow-green-900/20"
                  >
                    <Navigation size={15} />
                    Open Navigation
                  </button>
                  <a 
                    href={`tel:${data.active_delivery.customer_phone}`}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <Phone size={15} />
                    Call Customer
                  </a>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Route Info */}
                  <div className="flex-1 space-y-5">
                    {/* Pickup */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-green-600 ring-4 ring-green-100"></div>
                        <div className="w-0.5 h-12 bg-gradient-to-b from-green-400 to-amber-400 mt-1"></div>
                      </div>
                      <div>
                        <p className="text-[11px] text-green-600 font-bold uppercase tracking-wider">
                          Pickup
                        </p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          Central Warehouse
                        </p>
                        <p className="text-xs text-gray-500">
                          45 Industrial Blvd, Sector 7
                        </p>
                      </div>
                    </div>

                    {/* Dropoff */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100"></div>
                      </div>
                      <div>
                        <p className="text-[11px] text-amber-600 font-bold uppercase tracking-wider">
                          Dropoff
                        </p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {data.active_delivery.delivery_address.split(",")[0]}
                        </p>
                        <p className="text-xs text-gray-500">
                          {data.active_delivery.delivery_address}
                        </p>
                      </div>
                    </div>

                    {/* Payment Status */}
                    {data.active_delivery.payment_method && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Payment:</span>
                        <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${data.active_delivery.is_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {data.active_delivery.is_paid ? 'Paid' : 'COD'}
                        </span>
                      </div>
                    )}

                    {/* Order Items */}
                    {data.active_delivery.items && data.active_delivery.items.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Items</p>
                        <div className="flex flex-wrap gap-2">
                          {data.active_delivery.items.map((item, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">
                              {item.quantity} {item.unit_name || 'kg'} {item.name} — ₹{item.unit_price}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm font-bold text-gray-900 pt-1">Total: ₹{data.active_delivery.total_amount}</p>
                      </div>
                    )}

                    {/* Special Notes */}
                    {data.active_delivery.notes && (
                      <div className="flex items-start gap-3 bg-blue-50/80 rounded-xl px-4 py-3 border border-blue-100">
                        <AlertCircle
                          size={16}
                          className="text-blue-500 mt-0.5 shrink-0"
                        />
                        <p className="text-xs text-blue-700 leading-relaxed">
                          <strong>Note:</strong> {data.active_delivery.notes}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {data.active_delivery.status === "CONFIRMED" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(
                              data.active_delivery.order_id,
                              "OUT_FOR_DELIVERY"
                            )
                          }
                          disabled={updatingStatus}
                          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50"
                        >
                          <Truck size={15} />
                          Start Delivery
                        </button>
                      )}
                      {data.active_delivery.status === "OUT_FOR_DELIVERY" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(
                              data.active_delivery.order_id,
                              "DELIVERED"
                            )
                          }
                          disabled={updatingStatus}
                          className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800 transition-all disabled:opacity-50 shadow-lg shadow-green-900/20"
                        >
                          <CheckCircle2 size={15} />
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>


                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Package size={28} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                No Active Delivery
              </h3>
              <p className="text-sm text-gray-500">
                You'll be notified when a new order is assigned to you.
              </p>
            </div>
          )}
        </div>
        
        {/* Live Map Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Live Location</h3>
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <MapPin size={16} />
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px] rounded-xl overflow-hidden relative z-0 border border-gray-200/60 bg-gray-50">
            {data.active_delivery ? (
              <DeliveryMap 
                lat={data.active_delivery.delivery_latitude} 
                lng={data.active_delivery.delivery_longitude} 
                address={data.active_delivery.delivery_address} 
                driverlocation={driverlocation}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <MapPin size={32} className="mb-2 opacity-50" />
                <span className="text-sm font-medium">No active delivery to map</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Schedule */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Daily Schedule</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={15} />
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wider px-6 py-3">
                  Estimated Time
                </th>
                <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wider px-4 py-3">
                  Order ID
                </th>
                <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wider px-4 py-3">
                  Customer
                </th>
                <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wider px-4 py-3">
                  Location
                </th>
                <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wider px-4 py-3">
                  Payment
                </th>
                <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wider px-6 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {scheduleItems.map((item, i) => {
                const sc = statusConfig[item.status] || { label: item.status, cls: "bg-gray-100 text-gray-600" };
                return (
                  <tr
                    key={item.order_id || i}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {new Date(item.assigned_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-gray-900">
                      #{item.order_number}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {item.customer_name}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 max-w-[180px] truncate">
                      {item.delivery_address}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${item.is_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.is_paid ? 'Paid' : 'COD'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${sc.cls}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-sm text-green-700 font-semibold hover:text-green-900 transition-colors flex items-center gap-1">
                        View Details
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state when no schedule */}
        {scheduleItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No upcoming deliveries scheduled.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 pt-6 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
        <p>© 2024 Freshinbasket Logistics. Freshness Delivered.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-gray-600 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-gray-600 transition-colors">
            Driver Terms
          </a>
          <a href="#" className="hover:text-gray-600 transition-colors">
            Help Center
          </a>
        </div>
      </footer>
    </div>
  );
}
