"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth";
import Navbar from "@/app/components/Navbar";
import { CheckCircle, Clock, Package } from "lucide-react";

export default function OrderSuccessPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${id}/`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (err) {
        console.error("Failed to fetch order", err);
      }
    };
    fetchOrder();
  }, [id]);

  useEffect(() => {
    // Countdown display only — no router calls inside setState
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    // Redirect separately after 5 seconds
    const redirect = setTimeout(() => {
      router.push("/order");
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Order Successful!</h1>
          <p className="text-gray-500 mb-8">Thank you for shopping with us.</p>
          
          {order && (
            <div className="bg-green-50/50 rounded-xl p-4 text-left border border-green-100 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <Package size={20} className="text-green-700" />
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Order Number</p>
                  <p className="font-bold text-gray-900">{order.order_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-green-700" />
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Delivery Time</p>
                  <p className="font-bold text-gray-900"> ({order.delivery_slot})</p>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-500 font-medium">
            Redirecting to your orders in <span className="text-green-600 font-bold">{countdown}</span> seconds...
          </div>
          
          <button 
            onClick={() => router.push("/order")}
            className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl transition-colors"
          >
            View Orders Now
          </button>
        </div>
      </div>
    </div>
  );
}
