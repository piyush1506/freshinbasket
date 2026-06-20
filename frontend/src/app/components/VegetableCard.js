"use client";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";

export default function VegetableCard({ item }) {
  const [loading, setLoading] = useState(false);
  const { addToCart, removeFromCart, cartItems, updateCartQuantity, wishlistIds, toggleWishlist, user } = useCart();

  // Read actual qty from cart (source of truth)
  const cartItem = cartItems.find((c) => Number(c.id) === Number(item.id));
  const cartQty = cartItem ? Number(cartItem.quantity) : 0;

  // Local input state — tracks what user is typing
  const [inputVal, setInputVal] = useState(String(cartQty));

  // Keep input in sync when cartQty changes externally (e.g. from +/- buttons)
  useEffect(() => {
    setInputVal(String(cartQty));
  }, [cartQty]);

  const itemUnit = item.unit?.name || 'kg';

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

  // Called on blur or Enter — applies the typed value to the cart
  const handleInputCommit = async () => {
    const parsed = parseInt(inputVal, 10);

    // Invalid or unchanged — reset to current cartQty
    if (isNaN(parsed) || parsed < 0) {
      setInputVal(String(cartQty));
      return;
    }

    if (parsed === cartQty) return; // no change needed

    if (loading) return;
    setLoading(true);
    try {
      if (parsed === 0) {
        await removeFromCart(item.id);
        toast.success("Item removed from cart.");
      } else {
        // Send the delta so CartContext can handle it
        const delta = parsed - cartQty;
        await addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          image_url: item.image_url,
          quantity: delta,
          unit: itemUnit,
        });
        toast.success(`Quantity updated to ${parsed}`);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Could not update quantity.");
      setInputVal(String(cartQty)); // revert on error
    } finally {
      setLoading(false);
    }
  };

  const isOutOfStock = Number(item.stock) <= 0;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full group">
      <div className="relative h-48 w-full overflow-hidden rounded-t-xl">
        <Link href={`/product/${item.id}`} className="block relative w-full h-full">
          <Image
            src={item.image_url || item.image || "https://via.placeholder.com/400x300?text=No+Image"}
            alt={item.name}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width:768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            className="group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        {user && (
          <button
            onClick={(e) => { e.preventDefault(); toggleWishlist(item.id); }}
            className="absolute top-2 left-2 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
          >
            <Heart
              size={18}
              className={wishlistIds?.includes(Number(item.id)) ? "fill-red-500 text-red-500" : "text-gray-600"}
            />
          </button>
        )}
        <div className="absolute top-2 right-2">
          {isOutOfStock ? (
            <span className="bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">Sold Out</span>
          ) : (
            <span className="bg-green-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">In Stock</span>
          )}
        </div>
        {Number(item.discount_percentage) > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-red-500 text-white px-2 py-1 rounded-lg shadow-md">
            <span className="text-[10px] line-through opacity-80">₹{Number(item.mrp)}</span>
            <span className="text-xs font-bold">{item.discount_percentage}% OFF</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        {/* Title + Price on md screens */}
        <div className="md:flex md:items-center md:justify-between">
          <Link href={`/product/${item.id}`}>
            <h3 className="text-base font-bold text-gray-800 capitalize mb-1 md:mb-0 hover:text-green-700 transition-colors line-clamp-1">{item.name}</h3>
          </Link>
          {/* Price alongside title on md only */}
          <span className="hidden md:inline-flex text-base sm:text-lg font-bold text-green-700 whitespace-nowrap">
            ₹{ (Number(item.price))}
            <span className="text-xs sm:text-sm font-medium text-gray-400 ml-0.5">/{itemUnit}</span>
          </span>
        </div>
        <p className="text-gray-500 text-xs mb-3">Farm Fresh</p>

        <div className="flex items-center justify-between mt-auto gap-1 sm:gap-2">
          {/* Price - hidden on md, shown on sm and lg+ */}
          <span className="md:hidden text-base sm:text-lg font-bold text-green-700 whitespace-nowrap">
            ₹{ (Number(item.price))}
            <span className="text-xs sm:text-sm font-medium text-gray-400 ml-0.5">/{itemUnit}</span>
          </span>
          {isOutOfStock ? (
            <span className="text-xs font-semibold text-red-400">Unavailable</span>
          ) : cartQty > 0 ? (
            <div className="flex items-center space-x-1 sm:space-x-1.5 bg-green-700 text-white px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg shrink-0">
              <button onClick={handleDecrement} disabled={loading}
                className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center bg-white text-green-700 font-bold rounded-full hover:bg-green-100 transition-colors disabled:opacity-50 text-xs sm:text-sm"
              >-</button>
              <input type="number" min="0" value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onBlur={handleInputCommit}
                onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                disabled={loading}
                className="w-5 sm:w-7 text-center text-xs sm:text-sm font-bold bg-transparent text-white outline-none border-b border-white/30 focus:border-white disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button onClick={handleIncrement} disabled={loading}
                className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center bg-white text-green-700 font-bold rounded-full hover:bg-green-100 transition-colors disabled:opacity-50 text-xs sm:text-sm"
              >+</button>
            </div>
          ) : (
            <button disabled={loading} onClick={handleAdd}
              className="bg-green-700 text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold hover:bg-green-800 transition-colors flex items-center gap-1 sm:gap-1.5 shrink-0"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">{loading ? "Adding..." : "Add"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
