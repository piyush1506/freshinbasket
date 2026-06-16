"use client";

import { X, Package, MapPin, CreditCard, Truck, CalendarDays, IndianRupee } from "lucide-react";

const statusLabels = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const statusColors = {
  PENDING: "bg-gray-100 text-gray-600",
  CONFIRMED: "bg-blue-100 text-blue-700",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function OrderDetailModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            Order {order.order_number ? `#${order.order_number}` : `#${order.id}`}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Payment */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
              {statusLabels[order.status] || order.status}
            </span>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${order.is_paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {order.is_paid ? "Paid" : order.payment_method === "COD" ? "Cash on Delivery" : "Unpaid"}
            </span>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Package size={16} className="text-gray-400" />
              Items
            </h3>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {order.items && order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{item.quantity} {item.unit_name || 'kg'}</span>
                    <span className="text-sm text-gray-700">{item.product_name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">₹{parseInt(item.total_price || item.unit_price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <IndianRupee size={16} className="text-gray-400" />
              Price Breakdown
            </h3>
            <div className="space-y-2 bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700">₹{parseInt(order.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery Charge</span>
                <span className="text-gray-700">
                  {parseInt(order.delivery_charge) === 0 ? (
                    <span className="text-green-600 font-medium">FREE</span>
                  ) : (
                    `₹${parseInt(order.delivery_charge)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">₹{parseInt(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {order.delivery_address && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                Delivery Address
              </h3>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
                {order.delivery_address}
              </p>
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100">
            <CalendarDays size={14} />
            <span>Placed: {new Date(order.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
