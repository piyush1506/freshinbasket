"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import VegetableCard from "../components/VegetableCard";
import { Search, ArrowLeft } from "lucide-react";

const PRODUCT_SEARCH_INDEX_KEY = "productSearchIndex";
const SEARCH_RESULT_LIMIT = 24;

const normalizeSearchText = (value = "") => value.trim().toLocaleLowerCase();

const rankProducts = (products, query) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  return products
    .map((item) => ({
      ...item,
      normalizedName: normalizeSearchText(item.name || ""),
    }))
    .filter((item) => item.normalizedName.includes(normalizedQuery))
    .sort((a, b) => {
      const aStarts = a.normalizedName.startsWith(normalizedQuery);
      const bStarts = b.normalizedName.startsWith(normalizedQuery);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;

      const positionDiff = a.normalizedName.indexOf(normalizedQuery) - b.normalizedName.indexOf(normalizedQuery);
      if (positionDiff !== 0) return positionDiff;

      return a.normalizedName.localeCompare(b.normalizedName);
    })
    .slice(0, SEARCH_RESULT_LIMIT)
    .map(({ normalizedName, ...item }) => item);
};

const getCachedSearchProducts = (query) => {
  if (typeof window === "undefined") return [];

  const normalizedQuery = normalizeSearchText(query);
  const cachedResults = sessionStorage.getItem(`productSearchResults:${normalizedQuery}`);
  if (cachedResults) {
    try {
      const parsed = JSON.parse(cachedResults);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      sessionStorage.removeItem(`productSearchResults:${normalizedQuery}`);
    }
  }

  const cachedIndex = sessionStorage.getItem(PRODUCT_SEARCH_INDEX_KEY);
  if (!cachedIndex) return [];

  try {
    const parsed = JSON.parse(cachedIndex);
    return Array.isArray(parsed) ? rankProducts(parsed, query) : [];
  } catch {
    sessionStorage.removeItem(PRODUCT_SEARCH_INDEX_KEY);
    return [];
  }
};

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      const timer = setTimeout(() => {
        setProducts([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const cached = getCachedSearchProducts(trimmedQuery);
    const cacheTimer = setTimeout(() => {
      setProducts(cached);
      setLoading(cached.length === 0);
    }, 0);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return () => clearTimeout(cacheTimer);
    }

    const controller = new AbortController();
    const base = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;

    const fetchProducts = async () => {
      try {
        if (cached.length === 0) {
          setLoading(true);
        }

        const res = await fetch(
          `${base}/api/v1/products/search/?q=${encodeURIComponent(trimmedQuery)}&limit=${SEARCH_RESULT_LIMIT}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await res.json();
        const productList = Array.isArray(data) ? data : data.results || [];
        sessionStorage.setItem(
          `productSearchResults:${normalizeSearchText(trimmedQuery)}`,
          JSON.stringify(productList)
        );
        setProducts(productList);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Search failed:", error);
        setProducts(cached);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      clearTimeout(cacheTimer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <ArrowLeft size={20} />
        </Link>

        <Search size={20} className="text-gray-400" />

        <h1 className="text-2xl font-bold text-gray-900">
          Results for &quot;{query}&quot;
        </h1>

        {!loading && (
          <span className="text-sm text-gray-500">
            {products.length} product
            {products.length !== 1 ? "s" : ""} found
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Searching...</p>
        </div>
      ) : products.length === 0 ? (
        /* No Results */
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-2">
            No products found
          </p>

          <p className="text-gray-400 text-sm">
            Try a different search term.
          </p>
        </div>
      ) : (
        /* Product Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {products.map((item) => (
            <VegetableCard
              key={item.id}
              item={item}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <>
      <Navbar />

      <Suspense
        fallback={
          <div className="text-center py-20 text-gray-500">
            Loading...
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </>
  );
}
