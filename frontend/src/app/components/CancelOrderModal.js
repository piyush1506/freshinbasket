"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";

const CANCEL_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Expected delivery time is too long",
  "Other"
];

export default function CancelOrderModal({ isOpen, onClose, onSubmit, order }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen || !order) return null;

  const handleSubmit = () => {
    if (!selectedReason) {
      setError("Please select a reason for cancellation");
      return;
    }
    
    if (selectedReason === "Other" && !otherReason.trim()) {
      setError("Please specify the reason");
      return;
    }

    const finalReason = selectedReason === "Other" ? otherReason : selectedReason;
    onSubmit(order.id, finalReason);
    setSelectedReason("");
    setOtherReason("");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="text-red-500" size={24} />
            Cancel Order
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Please tell us why you are cancelling Order {order.order_number ? `#${order.order_number}` : `#${order.id}`}.
          </p>

          <div className="space-y-3 mb-4">
            {CANCEL_REASONS.map((reason) => (
              <label key={reason} className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="cancel_reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => {
                    setSelectedReason(e.target.value);
                    setError("");
                  }}
                  className="mt-0.5 w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700 font-medium">{reason}</span>
              </label>
            ))}
          </div>

          {selectedReason === "Other" && (
            <div className="mb-4">
              <textarea
                value={otherReason}
                onChange={(e) => {
                  setOtherReason(e.target.value);
                  setError("");
                }}
                placeholder="Please describe your problem..."
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 min-h-[100px]"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
