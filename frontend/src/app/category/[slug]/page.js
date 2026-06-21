"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import VegetableCard from "../../components/VegetableCard";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

// Skeleton placeholder for product cards during loading
function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full animate-pulse">
      <div className="h-48 w-full bg-gray-200 rounded-t-xl" />
      <div className="p-4 flex flex-col flex-grow gap-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="mt-auto flex items-center justify-between">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-8 bg-gray-200 rounded-lg w-16" />
        </div>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  // Show a readable name from the slug immediately (capitalize first letter)
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
        const prodRes = await fetch(
          `${base}/api/v1/products/?category=${encodeURIComponent(slug)}`
        );

        if (!prodRes.ok) throw new Error(`Products fetch failed: ${prodRes.status}`);

        const data = await prodRes.json();
        setProducts(data);

        // Try to get the proper category name from the categories API in the background
        // This is non-blocking — the page already shows content
        fetch(`${base}/api/v1/categories/`)
          .then(res => res.ok ? res.json() : [])
          .then(categories => {
            const cat = categories.find((c) => c.slug?.toLowerCase() === slug?.toLowerCase());
            if (cat?.name) setCategoryName(cat.name);
          })
          .catch(() => {}); // Silently ignore — we already have a readable name
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
    <>
      <Navbar />
      <div className="max-w-8xl mx-auto px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{categoryName}</h1>
          <span className="text-sm text-gray-400">
            {loading ? "" : `${products.length} product${products.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-400 py-20">No products found in this category.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {products.map((item) => (
              <VegetableCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
