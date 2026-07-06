"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart, Minus, Plus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";

export default function VegetableCard({ item, isHome = false }) {
  const [loading, setLoading] = useState(false);
  const { addToCart, removeFromCart, cartItems, wishlistIds, toggleWishlist, user } = useCart();


  // Read actual qty from cart (source of truth)
  const cartItem = cartItems.find((c) => Number(c.id) === Number(item.id));
  const cartQty = cartItem ? Number(cartItem.quantity) : 0;

  const itemUnit = item.unit?.name || 'kg';
  const isOutOfStock = Number(item.stock) <= 0;

  // Order step (e.g. 0.25 for 250g steps) and min qty from backend
  const orderStep = Number(item.order_step) || 1;
  const minOrderQty = Number(item.min_order_qty) || 0;

  // cartQty IS the real quantity/weight stored in backend (e.g. 0.25, 0.5, 1)
  // Just display it directly with a clean unit label
  const getDisplayQuantity = () => {
    // Round to avoid float weirdness like 0.30000000000000004
    const displayValue = parseFloat(cartQty.toFixed(3));
    return { value: displayValue, unit: itemUnit };
  };

  const { value: displayQty, unit: displayUnit } = getDisplayQuantity();

  // ADD: add one step (or min_order_qty if set above 0)
  const handleAdd = async () => {
    if (loading) return;
    setLoading(true);
    const initialQty = minOrderQty > 0 ? minOrderQty : orderStep;
    try {
      await addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        quantity: initialQty,
        unit: itemUnit,
      });
      toast.success("Added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Could not add item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // +: increment by order_step
  const handleIncrement = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        quantity: orderStep,
        unit: itemUnit,
      });
    } catch (error) {
      console.error("Error incrementing:", error);
      toast.error("Could not update quantity.");
    } finally {
      setLoading(false);
    }
  };

  // -: decrement by order_step; remove item if qty would reach 0 or below min
  const handleDecrement = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const newQty = parseFloat((cartQty - orderStep).toFixed(3));
      // Remove if going to 0 or negative, or below min_order_qty (if set)
      if (newQty <= 0 || (minOrderQty > 0 && newQty < minOrderQty)) {
        await removeFromCart(item.id);
      } else {
        await addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          image_url: item.image_url,
          quantity: -orderStep,
          unit: itemUnit,
        });
      }
    } catch (error) {
      console.error("Error decrementing:", error);
      toast.error("Could not update quantity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col h-full relative p-2.5 sm:p-3 select-none group">
      {/* Image Wrapper */}
      <div className="relative aspect-square w-full bg-gray-50/50 rounded-xl border border-gray-100 flex items-center justify-center p-2 mb-2 sm:mb-2.5 overflow-hidden">
        <Link href={`/product/${item.id}`} className="block relative w-full h-full">
          <Image
            src={item.image_url || item.image || "/placeholder.svg"}
            alt={item.name}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width:768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            className="group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        
        {/* Wishlist Heart */}
        {user && (
          <button
            onClick={(e) => { e.preventDefault(); toggleWishlist(item.id); }}
            className="absolute top-2 right-2 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm border border-gray-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label={wishlistIds?.includes(Number(item.id)) ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`}
          >
            <Heart
              size={14}
              className={wishlistIds?.includes(Number(item.id)) ? "fill-red-500 text-red-500" : "text-gray-500 hover:text-red-500"}
              aria-hidden="true"
            />
          </button>
        )}

        {/* Discount Badge (Stacked layout matching screenshot) */}
        {Number(item.discount_percentage) > 0 && (
          <div className="absolute top-0 left-0 bg-[#2470f1] text-white flex flex-col items-center justify-center rounded-br-lg rounded-tl-xl w-8 h-8 sm:w-9 sm:h-9 text-[8px] sm:text-[9px] font-extrabold uppercase leading-none shadow-sm">
            <span>{item.discount_percentage}%</span>
            <span className="mt-0.5">OFF</span>
          </div>
        )}

        {/* Dynamic Section Tag */}
        {item.section_product_label && (
          <div className="absolute bottom-2 left-2 z-10 bg-green-600 text-white flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase shadow-sm tracking-wider">
            
            <span>{item.section_product_label}</span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl z-10">
            <span className="bg-red-500 text-white text-[10px] sm:text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md">Sold Out</span>
          </div>
        )}
      </div>

      {/* Details Wrapper */}
      <div className="flex flex-col flex-grow">
        {/* Product Title */}
        <Link href={`/product/${item.id}`} className="block mb-0.5">
          <h3 className="text-xs sm:text-sm font-bold text-gray-800 line-clamp-2 h-8 sm:h-10 leading-snug hover:text-[#0c831f] transition-colors capitalize">
            {item.name}
          </h3>
        </Link>

        {/* Unit / Weight or Price (when added on View All page) */}
        {/* Unit / Weight or Price (when added to cart) */}
        {cartQty > 0 ? (
          <div className="mb-3 flex items-center gap-1.5">
            <span className="text-sm sm:text-base font-black text-gray-900 leading-none">
              ₹{parseInt(item.price)}
            </span>
            {Number(item.discount_percentage) > 0 && (
              <span className="text-[11px] sm:text-xs text-green-800 line-through font-bold leading-none">
                ₹{parseInt(item.mrp || item.price)}
              </span>
            )}
          </div>
        ) : (
          <div className="text-xs sm:text-xs font-semibold text-gray-600 mb-3 flex items-center gap-0.5">
            <span>{itemUnit}</span>
            <span className="text-[10px] text-gray-600 ml-0.5" aria-hidden="true">▼</span>
          </div>
        )}

        {/* Bottom Action Section */}
        <div className={`flex items-center mt-auto pt-1 gap-2 ${cartQty > 0 ? 'justify-end' : 'justify-between'}`}>
          {/* Prices (shown when cartQty === 0) */}
          {cartQty === 0 && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base font-black text-gray-900 truncate leading-none">
                ₹{parseInt(item.price)}
              </span>
              {Number(item.discount_percentage) > 0 && (
                <span className="text-[11px] sm:text-xs text-green-800 line-through font-bold leading-none mt-1">
                  ₹{parseInt(item.mrp || item.price)}
                </span>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className={`shrink-0 ${cartQty > 0 ? 'w-full' : ''}`}>
            {isOutOfStock ? (
              <span className="text-[10px] sm:text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100">
                Unavailable
              </span>
            ) : cartQty > 0 ? (
              <div className="flex items-center gap-2 justify-end w-full">
                <div className="flex items-center justify-between w-[85px] sm:w-[95px] shrink-0 bg-[#216140] text-white rounded-lg select-none shadow-sm p-1">
                  <button
                    onClick={handleDecrement}
                    disabled={loading}
                    className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center text-white hover:bg-[#1a4d32] rounded-md transition-colors disabled:opacity-50"
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    <Minus size={13} className="stroke-[3.5px]" aria-hidden="true" />
                  </button>
                  
                  <div className="flex items-center justify-center px-1">
                    <span className="text-xs sm:text-[13px] font-extrabold text-white leading-none">{displayQty}</span>
                  </div>

                  <button
                    onClick={handleIncrement}
                    disabled={loading}
                    className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center text-white hover:bg-[#1a4d32] rounded-md transition-colors disabled:opacity-50"
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    <Plus size={13} className="stroke-[3.5px]" aria-hidden="true" />
                  </button>
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-gray-700 whitespace-nowrap">{displayUnit}</span>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                disabled={loading}
                className="border border-[#0c831f] text-[#0c831f] bg-white hover:bg-emerald-50 text-[11px] sm:text-xs font-bold px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg transition-colors shadow-sm uppercase tracking-wider"
              >
                {loading ? "..." : "ADD"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
