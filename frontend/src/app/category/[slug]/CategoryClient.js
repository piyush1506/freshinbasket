"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function CategoryClient({ initialCategoryName }) {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState(
    initialCategoryName ||
      (slug ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ") : "")
  );
  const [loading, setLoading] = useState(true);

  // Update name if slug changes client-side and we don't have a server-provided name
  useEffect(() => {
    if (!initialCategoryName && slug) {
      setCategoryName(slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "));
    }
  }, [slug, initialCategoryName]);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error("NEXT_PUBLIC_API_URL is not defined");
        setLoading(false);
        return;
      }

      const base = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;

      try {
        // Only fetch products — layout already handles category list,
        // and server already resolved the category name via initialCategoryName
        const prodRes = await fetch(`${base}/api/v1/products/?category=${encodeURIComponent(slug)}`);
        if (!prodRes.ok) throw new Error(`Products fetch failed: ${prodRes.status}`);
        const prodData = await prodRes.json();
        setProducts(prodData);
      } catch (err) {
        console.error("Category page fetch error:", err);
        toast.error("Failed to load products. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  return (
    <>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-3">🥬</span>
          <p className="text-gray-400 text-sm font-semibold">
            No products found in this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {products.map((item) => (
            <VegetableCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
