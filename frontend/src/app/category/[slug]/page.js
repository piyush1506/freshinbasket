"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../../components/Navbar";
import VegetableCard from "../../components/VegetableCard";
import toast from "react-hot-toast";

// Skeleton placeholder for product cards during loading
function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 flex flex-col h-full p-3 animate-pulse">
      <div className="aspect-square w-full bg-gray-200 rounded-xl mb-3" />
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-1" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
      <div className="flex items-center justify-between mt-auto">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-8 bg-gray-200 rounded-lg w-16" />
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState(
    slug ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ') : ""
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error("NEXT_PUBLIC_API_URL is not defined");
        setLoading(false);
        return;
      }

      const base = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`${base}/api/v1/products/?category=${encodeURIComponent(slug)}`),
          fetch(`${base}/api/v1/categories/`)
        ]);

        if (!prodRes.ok) throw new Error(`Products fetch failed: ${prodRes.status}`);

        const prodData = await prodRes.json();
        setProducts(prodData);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
          const currentCat = catData.find((c) => c.slug?.toLowerCase() === slug?.toLowerCase());
          if (currentCat?.name) setCategoryName(currentCat.name);
        }
      } catch (err) {
        console.error("Category page fetch error:", err);
        toast.error("Failed to load category data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Container: Split Sidebar & Products grid */}
      <div className="flex flex-1 overflow-hidden bg-white">
        
        {/* Left Sidebar: Category list (Vertical Scrollable, scrollbars hidden) */}
        <aside className="w-20 sm:w-24 md:w-60 bg-[#f8f9fa] border-r border-gray-200 overflow-y-auto shrink-0 flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {categories.map((cat) => {
            const isActive = cat.slug?.toLowerCase() === slug?.toLowerCase();
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className={`flex flex-col md:flex-row items-center md:gap-3 p-2 sm:p-3 md:px-4 md:py-3 border-b border-gray-200/40 transition-all text-center md:text-left ${
                  isActive
                    ? "bg-white border-l-4 border-l-[#216140] font-black text-[#216140]"
                    : "hover:bg-gray-100 text-gray-600 font-semibold"
                }`}
              >
                {/* Category Icon / Image */}
                <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-10 md:h-10 rounded-xl overflow-hidden flex items-center justify-center border shrink-0 bg-white shadow-sm ${
                  isActive ? "border-green-100" : "border-gray-200/50"
                }`}>
                  {cat.image_url ? (
                    <Image
                      src={cat.image_url}
                      alt={cat.name}
                      width={44}
                      height={44}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-base">🛒</span>
                  )}
                </div>
                
                {/* Category Name */}
                <span className="text-[9px] sm:text-[10px] md:text-xs leading-tight mt-1.5 md:mt-0 capitalize line-clamp-2 md:line-clamp-2">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </aside>

        {/* Right Content: Products Grid (Vertical Scrollable) */}
        <main className="flex-1 overflow-y-auto bg-white px-3.5 py-4 sm:p-6 pb-28 md:pb-24">
          
          {/* Header */}
          <div className="mb-4 sm:mb-5">
            <h1 className="text-sm sm:text-lg font-black text-gray-900 capitalize leading-none">
              {categoryName}
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
              {loading ? "Loading products..." : `${products.length} products`}
            </p>
          </div>

          {/* Grid list */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-4xl mb-3">🥬</span>
              <p className="text-gray-400 text-sm font-semibold">No products found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
              {products.map((item) => (
                <VegetableCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
