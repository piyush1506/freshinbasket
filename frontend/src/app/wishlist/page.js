"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/Navbar";
import VegetableCard from "../components/VegetableCard";
import { useCart } from "../context/CartContext";
import { Bookmark, ArrowLeft, ShoppingBag, Trash2 } from "lucide-react";
import { getAccessToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const router = useRouter();
  const { wishlistIds, toggleWishlist, fetchWishlistIds } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetchProducts();
  }, [wishlistIds]);

  const fetchProducts = async () => {
    if (wishlistIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/`);
      if (res.ok) {
        const all = await res.json();
        setProducts(all.filter((p) => wishlistIds.includes(Number(p.id))));
      }
    } catch {
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-700 border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bookmark size={28} className="text-green-700" />
              My Wishlist
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {products.length === 0
                ? "Your wishlist is empty"
                : `${products.length} item${products.length > 1 ? "s" : ""} saved`}
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark size={64} className="mx-auto text-gray-200 mb-4" />
            <h2 className="text-xl font-semibold text-gray-500 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-400 mb-6">Save your favorite items to quickly find them later</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-800 transition-colors"
            >
              <ShoppingBag size={18} />
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {products.map((item) => (
              <VegetableCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
