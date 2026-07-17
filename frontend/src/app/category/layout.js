"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/Navbar";

const CATEGORIES_CACHE_KEY = "cat_layout_cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedCategories() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CATEGORIES_CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      sessionStorage.removeItem(CATEGORIES_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedCategories(data) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export default function CategoryLayout({ children }) {
  const params = useParams();
  const slug = params?.slug;
  const [allCategories, setAllCategories] = useState([]);
  const [categories, setCategories] = useState([]);

  // Fetch once and cache — don't re-fetch on every slug change
  useEffect(() => {
    const fetchCategories = async () => {
      const cached = getCachedCategories();
      if (cached) {
        setAllCategories(cached);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) return;
      const base = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      try {
        const catRes = await fetch(`${base}/api/v1/categories/`);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCachedCategories(catData);
          setAllCategories(catData);
        }
      } catch (err) {
        console.error("Layout categories fetch error:", err);
      }
    };
    fetchCategories();
  }, []); // ← fetch ONCE on mount, not on every slug change

  // Filter sidebar categories when slug or allCategories changes
  useEffect(() => {
    if (!allCategories.length) return;
    if (slug) {
      const currentCat = allCategories.find((c) => c.slug?.toLowerCase() === slug?.toLowerCase());
      if (currentCat && currentCat.section) {
        setCategories(allCategories.filter((c) => c.section === currentCat.section));
      } else {
        setCategories(allCategories);
      }
    } else {
      setCategories(allCategories);
    }
  }, [slug, allCategories]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden bg-white">
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
                <span className="text-[9px] sm:text-[10px] md:text-xs leading-tight mt-1.5 md:mt-0 capitalize line-clamp-2 md:line-clamp-2">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </aside>
        <main className="flex-1 overflow-y-auto bg-white px-3.5 py-4 sm:p-6 pb-28 md:pb-24">
          {children}
        </main>
      </div>
    </div>
  );
}
