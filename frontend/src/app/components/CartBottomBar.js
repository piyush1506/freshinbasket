"use client";
import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "../context/CartContext";
import { ShoppingCart } from "lucide-react";

export default function CartBottomBar() {
  const { cartItems, cartCount } = useCart();
  const pathname = usePathname();

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [cartItems]
  );

  if (pathname === "/cart" || cartCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-2 sm:px-4 md:px-6 pb-2 sm:pb-4 pointer-events-none">
      <div className="w-full max-w-5xl mx-auto bg-[#216140] rounded-xl sm:rounded-2xl shadow-2xl shadow-black/20 pointer-events-auto animate-slide-up">
        <Link href="/cart" className="flex items-center justify-between px-3 sm:px-5 md:px-8 py-3 sm:py-4 md:py-2">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <div className="relative">
              <ShoppingCart className="w-5 h-3 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" strokeWidth={2} />
              <span className="absolute -top-2 -right-2 bg-[#F59E0B] text-white text-[9px] sm:text-[10px] md:text-xs font-bold px-1 sm:px-1.5 py-0.5 rounded-full border-2 border-[#216140] min-w-[16px] sm:min-w-[18px] md:min-w-[20px] text-center">
                {cartCount}
              </span>
            </div>
            <div>
              <p className="text-white/80 text-[10px] sm:text-xs md:text-sm font-semibold">Cart Total</p>
              <p className="text-white text-base sm:text-lg md:text-2xl font-extrabold">₹{totalPrice.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white text-[#216140] px-3 sm:px-5 md:px-7 py-1.5 sm:py-2 md:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base font-extrabold flex items-center gap-1 sm:gap-2">
            View Cart
            <span className="text-sm sm:text-base md:text-lg">→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
