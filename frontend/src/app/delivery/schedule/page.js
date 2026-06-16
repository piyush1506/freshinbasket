"use client";

import { useState, useEffect } from "react";
import { getAccessToken } from "@/lib/auth";
import {
  CalendarClock,
  MapPin,
  Clock,
  Package,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Phone,
  CheckCircle2,
  Truck,
  Filter,
  ArrowUpDown,
} from "lucide-react";

const statusColors = {
  CONFIRMED: { bg: "bg-blue-100", text: "text-blue-700", label: "Confirmed" },
  OUT_FOR_DELIVERY: { bg: "bg-amber-100", text: "text-amber-700", label: "In Transit" },
  DELIVERED: { bg: "bg-green-100", text: "text-green-700", label: "Delivered" },
  QUEUED: { bg: "bg-gray-100", text: "text-gray-600", label: "Queued" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
};

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("timeline"); // timeline or list
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = getAccessToken();
      if (!token) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/delivery/orders/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
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

    fetchOrders();
  }, []);

  // Demo schedule data
  const demoSchedule = [
    {
      id: 1,
      time: "09:00 AM",
      order_number: "HF-A12B",
      customer_name: "Priya Sharma",
      delivery_address: "42 MG Road, Block A, Indiranagar",
      status: "DELIVERED",
      total_amount: "320.00",
      items: [
        { name: "Organic Spinach", quantity: 2 },
        { name: "Fresh Tomatoes", quantity: 3 },
      ],
    },
    {
      id: 2,
      time: "10:30 AM",
      order_number: "HF-B34C",
      customer_name: "Rahul Verma",
      delivery_address: "78 Koramangala 4th Block",
      status: "DELIVERED",
      total_amount: "545.00",
      items: [
        { name: "Mixed Fruit Basket", quantity: 1 },
        { name: "Green Peas", quantity: 2 },
      ],
    },
    {
      id: 3,
      time: "12:15 PM",
      order_number: "HF-C56D",
      customer_name: "Ananya Patel",
      delivery_address: "15 HSR Layout, Sector 2",
      status: "OUT_FOR_DELIVERY",
      total_amount: "680.00",
      items: [
        { name: "Baby Spinach", quantity: 1 },
        { name: "Avocado Pack", quantity: 2 },
        { name: "Cherry Tomatoes", quantity: 1 },
      ],
    },
    {
      id: 4,
      time: "02:30 PM",
      order_number: "HF-D78E",
      customer_name: "Vikram Singh",
      delivery_address: "22 Whitefield Main Rd, Phase 1",
      status: "CONFIRMED",
      total_amount: "412.00",
      items: [
        { name: "Broccoli", quantity: 2 },
        { name: "Red Onions", quantity: 5 },
      ],
    },
    {
      id: 5,
      time: "03:45 PM",
      order_number: "HF-E90F",
      customer_name: "Meera Iyer",
      delivery_address: "5 Jayanagar 9th Block",
      status: "CONFIRMED",
      total_amount: "275.00",
      items: [{ name: "Seasonal Veggie Box", quantity: 1 }],
    },
    {
      id: 6,
      time: "05:00 PM",
      order_number: "HF-F12G",
      customer_name: "Arjun Reddy",
      delivery_address: "33 Electronic City Phase 2",
      status: "CONFIRMED",
      total_amount: "590.00",
      items: [
        { name: "Organic Carrots", quantity: 3 },
        { name: "Fresh Coriander", quantity: 2 },
        { name: "Green Chillies", quantity: 1 },
      ],
    },
  ];

  const scheduleData = orders.length > 0
    ? orders.map((o, i) => ({
        id: o.order_id,
        time: new Date(o.assigned_at).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        order_number: o.order_number,
        customer_name: o.customer_name,
        delivery_address: o.delivery_address,
        status: o.status,
        total_amount: o.total_amount,
        items: o.items,
      }))
    : demoSchedule;

  // Generate calendar days
  const getDaysInWeek = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDays = getDaysInWeek();

  const navigateWeek = (dir) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir * 7);
    setSelectedDate(d);
  };

  const delivered = scheduleData.filter((s) => s.status === "DELIVERED").length;
  const remaining = scheduleData.length - delivered;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Route Schedule
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Plan your delivery routes efficiently
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === "timeline"
                ? "bg-[#2D6A2E] text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === "list"
                ? "bg-[#2D6A2E] text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {/* Week Calendar Strip */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <h3 className="text-sm font-semibold text-gray-700">
            {selectedDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected =
              day.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={`
                  flex flex-col items-center py-3 rounded-xl transition-all duration-200
                  ${
                    isSelected
                      ? "bg-[#2D6A2E] text-white shadow-lg shadow-green-900/20"
                      : isToday
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "hover:bg-gray-50 text-gray-600"
                  }
                `}
              >
                <span className="text-[11px] font-medium uppercase">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="text-lg font-bold mt-1">
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
            <Package size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-gray-900">
              {scheduleData.length}
            </p>
            <p className="text-xs text-gray-500">Total Orders</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-gray-900">{delivered}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-gray-900">
              {remaining}
            </p>
            <p className="text-xs text-gray-500">Remaining</p>
          </div>
        </div>
      </div>

      {/* Schedule Content */}
      {viewMode === "timeline" ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-green-300 via-green-400 to-gray-200"></div>

            <div className="space-y-1">
              {scheduleData.map((item, i) => {
                const statusStyle =
                  statusColors[item.status] || statusColors.QUEUED;
                const isExpanded = expandedOrder === item.id;

                return (
                  <div key={item.id} className="relative flex gap-5">
                    {/* Timeline dot */}
                    <div className="relative z-10 mt-5">
                      <div
                        className={`w-[14px] h-[14px] rounded-full border-[3px] ${
                          item.status === "DELIVERED"
                            ? "bg-green-500 border-green-200"
                            : item.status === "OUT_FOR_DELIVERY"
                            ? "bg-amber-500 border-amber-200 animate-pulse"
                            : "bg-white border-gray-300"
                        }`}
                      ></div>
                    </div>

                    {/* Card */}
                    <div
                      className={`flex-1 rounded-xl border transition-all duration-200 cursor-pointer mb-3 ${
                        isExpanded
                          ? "border-green-200 shadow-lg shadow-green-900/5 bg-green-50/30"
                          : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                      }`}
                      onClick={() =>
                        setExpandedOrder(isExpanded ? null : item.id)
                      }
                    >
                      <div className="px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-xs text-gray-400 font-medium">
                              {item.time}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {item.order_number}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.customer_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 hidden sm:block">
                            {item.delivery_address.slice(0, 30)}...
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            {statusStyle.label}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-5 pb-4 border-t border-gray-100 pt-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <MapPin
                              size={14}
                              className="text-gray-400 mt-0.5 shrink-0"
                            />
                            <p className="text-sm text-gray-600">
                              {item.delivery_address}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-medium mb-1.5">
                              Items:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {item.items.map((it, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg"
                                >
                                  {it.quantity}x {it.name}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-bold text-gray-900">
                              ₹{item.total_amount}
                            </span>
                            <div className="flex gap-2">
                              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2D6A2E] text-white text-xs font-medium rounded-lg hover:bg-[#245824] transition-colors">
                                <Navigation size={12} />
                                Navigate
                              </button>
                              <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                                <Phone size={12} />
                                Call
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-[11px] text-gray-400 font-semibold uppercase tracking-wider px-6 py-3">
                    Time
                  </th>
                  <th className="text-left text-[11px] text-gray-400 font-semibold uppercase tracking-wider px-4 py-3">
                    Order
                  </th>
                  <th className="text-left text-[11px] text-gray-400 font-semibold uppercase tracking-wider px-4 py-3">
                    Customer
                  </th>
                  <th className="text-left text-[11px] text-gray-400 font-semibold uppercase tracking-wider px-4 py-3">
                    Address
                  </th>
                  <th className="text-left text-[11px] text-gray-400 font-semibold uppercase tracking-wider px-4 py-3">
                    Amount
                  </th>
                  <th className="text-left text-[11px] text-gray-400 font-semibold uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-[11px] text-gray-400 font-semibold uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {scheduleData.map((item) => {
                  const statusStyle =
                    statusColors[item.status] || statusColors.QUEUED;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {item.time}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-gray-900">
                        {item.order_number}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {item.customer_name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                        {item.delivery_address}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                        ₹{item.total_amount}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="p-1.5 rounded-lg hover:bg-green-50 text-green-700 transition-colors">
                            <Navigation size={14} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                            <Phone size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
