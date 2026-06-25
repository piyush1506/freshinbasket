"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

import { Suspense } from "react";

function OrderFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get("reason") || "An unexpected error occurred during checkout.";

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-red-100">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={48} className="text-red-600" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-500 mb-6">We could not process your order.</p>
        
        <div className="bg-red-50/50 rounded-xl p-4 text-left border border-red-100 mb-8">
          <p className="text-sm text-red-800 font-medium">
            <span className="font-bold block mb-1">Reason:</span> 
            {errorMessage}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => router.push("/cart")}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
          <button 
            onClick={() => router.push("/")}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderFailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
        <OrderFailContent />
      </Suspense>
    </div>
  );
}
