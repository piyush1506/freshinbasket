import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function VegetableCard({ item }) {
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { addToCart, removeFromCart, cartItems, wishlistIds, toggleWishlist, user } = useCart();

  // Read actual qty from cart (source of truth)
  const cartItem = cartItems.find((c) => Number(c.id) === Number(item.id));
  const cartQty = cartItem ? Number(cartItem.quantity) : 0;

  const itemUnit = item.unit?.name || 'kg';
  const isOutOfStock = Number(item.stock) <= 0;

  const handleAdd = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        quantity: 1,
        unit: itemUnit,
      });
      toast.success("Added to cart!");
      setShowUnitAnimation(true);
      setTimeout(() => setShowUnitAnimation(false), 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Could not add item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        quantity: 1,
        unit: itemUnit,
      });
    } catch (error) {
      console.error("Error incrementing:", error);
      toast.error("Could not update quantity.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecrement = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (cartQty <= 1) {
        await removeFromCart(item.id);
      } else {
        await addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          image_url: item.image_url,
          quantity: -1,
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

  const getUnitPosition = () => {
    if (cartQty > 0) {
      return 'left';
    }
    return 'right';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col h-full relative p-2.5 sm:p-3 select-none group">
      {/* Image Wrapper */}
      <div className="relative aspect-square w-full bg-gray-50/50 rounded-xl border border-gray-100 flex items-center justify-center p-2 mb-2 sm:mb-2.5 overflow-hidden">
        <Link href={`/product/${item.id}`} className="block relative w-full h-full">
          <Image
            src={imgError ? "/placeholder.svg" : (item.image_url || item.image || "/placeholder.svg")}
            alt={item.name}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width:768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            className="group-hover:scale-105 transition-transform duration-300"
            unoptimized
            onError={() => setImgError(true)}
          />
        </Link>

        {/* Wishlist Heart */}
        {user && (
          <button
            onClick={(e) => { e.preventDefault(); toggleWishlist(item.id); }}
            className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm border border-gray-100"
          >
            <Heart
              size={14}
              className={wishlistIds?.includes(Number(item.id)) ? "fill-red-500 text-red-500" : "text-gray-500 hover:text-red-500"}
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

        {/* Price & Unit with unit permanently displayed */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm sm:text-base font-black text-gray-900 truncate leading-none">
            ₹{parseInt(item.price)}
          </span>
          <span className="text-xs font-semibold text-gray-500">
            /{itemUnit}
          </span>
        </div>

        {/* Action Button */}
        <div className="shrink-0">
          {isOutOfStock ? (
            <span className="text-[10px] sm:text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100">
              Unavailable
            </span>
          ) : cartQty > 0 ? (
            <div className="flex items-center bg-[#216140] md:h-[20px] w-1/3 text-white rounded-lg p-1 sm:p-1.5 select-none shadow-sm">
              <button
                onClick={handleDecrement}
                disabled={loading}
                className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-white hover:bg-[#1a4d32] rounded-md transition-colors disabled:opacity-50"
              >
                <Minus size={10} className="stroke-[3.5px]" />
              </button>

              <span className="w-5 sm:w-6 text-center text-xs sm:text-sm font-extrabold text-white">
                {cartQty} <span className="text-[10px] font-normal text-white/80 ml-0.5">/{itemUnit.toLowerCase()}</span>
              </span>

              <button
                onClick={handleIncrement}
                disabled={loading}
                className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-white hover:bg-[#1a4d32] rounded-md transition-colors disabled:opacity-50"
              >
                <Plus size={10} className="stroke-[3.5px]" />
              </button>
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
          <span className="text-xs font-semibold text-white/80 ml-2">
                /{itemUnit}
              </span>
        </div>
      </div>
    </div>
  );
}