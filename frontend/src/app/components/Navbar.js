"use client";
import { useState, useEffect, useRef, useCallback, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { Search, ShoppingCart, Leaf, ChevronDown, User, Heart, Bookmark } from "lucide-react";
import { Squash as Hamburger } from 'hamburger-react';
import { clearAuth, AUTH_API, getUser } from "@/lib/auth";
import Logo from '../../../public/logo/logo.jpg'
import Image from "next/image";

const SUGGESTION_LIMIT = 20;
const PRELOAD_SUGGESTION_LIMIT = 1000;
const PRODUCT_SEARCH_INDEX_KEY = "productSearchIndex";

const normalizeSearchText = (value = "") => value.trim().toLocaleLowerCase();

const getLocalSuggestions = (products, query) => {
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
        .slice(0, SUGGESTION_LIMIT)
        .map(({ normalizedName, ...item }) => item);
};

export default function Navbar({ item }) {
    const { cartCount, user: contextUser, setUser, wishlistIds } = useCart();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const user = mounted ? (contextUser ?? getUser()) : null;
	
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [categories, setCategories] = useState([]);
    const searchRef = useRef(null);
    const suggestionCacheRef = useRef(new Map());
    const allSuggestionsRef = useRef([]);

    // Mark component as mounted (client-side only) to avoid hydration mismatch
    useEffect(() => { setMounted(true); }, []);

    // Fetch categories for bottom tier
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/`);
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                }
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
    }, []);

    const handleSearch = (e)=>{
        if(e.key === 'Enter' && searchQuery.trim()){
            setShowSuggestions(false);
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

    const selectSuggestion = (q) => {
        setSearchQuery(q);
        setShowSuggestions(false);
        router.push(`/search?q=${encodeURIComponent(q)}`);
    };

    const handleSearchQueryChange = (e) => {
        const value = e.target.value;
        const query = normalizeSearchText(value);
        setSearchQuery(value);

        if (!query) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const cached = suggestionCacheRef.current.get(query);
        const localMatches = cached || getLocalSuggestions(allSuggestionsRef.current, query);

        startTransition(() => {
            setSuggestions(localMatches);
            setShowSuggestions(localMatches.length > 0);
        });
    };

    // Preload names first for instant suggestions; warm product cards separately for the search page.
    useEffect(() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) return;

        const controller = new AbortController();
        const base = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

        try {
            const cachedIndex = sessionStorage.getItem(PRODUCT_SEARCH_INDEX_KEY);
            const parsedIndex = cachedIndex ? JSON.parse(cachedIndex) : [];
            if (Array.isArray(parsedIndex) && parsedIndex.length > 0) {
                allSuggestionsRef.current = parsedIndex.map(({ id, name }) => ({ id, name }));
            }
        } catch {
            sessionStorage.removeItem(PRODUCT_SEARCH_INDEX_KEY);
        }

        const preloadSuggestions = async () => {
            try {
                const res = await fetch(
                    `${base}/api/v1/products/search/?limit=${PRELOAD_SUGGESTION_LIMIT}&suggest=1`,
                    { signal: controller.signal }
                );
                if (!res.ok) return;

                const data = await res.json();
                allSuggestionsRef.current = data;
            } catch {
                // Search still works through the per-query request below.
            }
        };

        const preloadSearchIndex = async () => {
            try {
                const res = await fetch(
                    `${base}/api/v1/products/search/?limit=${PRELOAD_SUGGESTION_LIMIT}&index=1`,
                    { signal: controller.signal }
                );
                if (!res.ok) return;

                const data = await res.json();
                sessionStorage.setItem(PRODUCT_SEARCH_INDEX_KEY, JSON.stringify(data));
            } catch {
                // The search page can still fetch direct results if this cache is not ready.
            }
        };

        preloadSuggestions();
        preloadSearchIndex();

        return () => controller.abort();
    }, []);

    // Refresh the local cache for the exact query in the background.
    useEffect(() => {
        const query = searchQuery.trim();

        if (!query) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) return;

        const controller = new AbortController();
        const base = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

        const fetchSuggestions = async () => {
            try {
                const res = await fetch(
                    `${base}/api/v1/products/search/?q=${encodeURIComponent(query)}&limit=${SUGGESTION_LIMIT}&suggest=1`,
                    { signal: controller.signal }
                );
                if (!res.ok) return;

                const data = await res.json();
                suggestionCacheRef.current.set(query.toLowerCase(), data);
                setSuggestions(data);
                setShowSuggestions(data.length > 0);
            } catch (error) {
                if (error.name !== "AbortError") {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            }
        };

        fetchSuggestions();

        return () => controller.abort();
    }, [searchQuery]);

    // Close suggestions on outside click
    const handleClickOutside = useCallback((e) => {
        if (searchRef.current && !searchRef.current.contains(e.target)) {
            setShowSuggestions(false);
        }
    }, []);
    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside]);

    return (
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100 flex flex-col">
            {/* Top Tier: Logo, Location, Search, Profile, Cart */}
            <header className="flex items-center justify-between px-4 md:px-10 py-3 max-w-[1400px] w-full mx-auto gap-4 md:gap-8">
                
                {/* Logo Section */}
                <div className="flex items-center shrink-0">
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden relative">
                            <Image src={Logo} alt="Logo" width={100} height={100} quality={100} className="object-contain w-full h-full" />
                        </div>
                        <span className="hidden md:block text-2xl font-black text-[#216140] tracking-tighter">Freshinbasket</span>
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="flex-1 max-w-2xl" ref={searchRef}>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search for vegetables, fruits..."
                            aria-label="Search products"
                            value={searchQuery}
                            onChange={handleSearchQueryChange}
                            onKeyDown={handleSearch}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#F8F8F8] border border-gray-200 rounded-lg text-[14px] font-medium text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#216140] transition-all shadow-inner"
                        />

                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                {suggestions.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => selectSuggestion(p.name)}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 flex items-center gap-3 transition-colors"
                                    >
                                        <Search size={14} className="text-gray-400 shrink-0" />
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side Icons */}
                <div className="flex items-center gap-6 shrink-0">
                    
                    {/* Wishlist */}
                    <Link href='/wishlist' className="hidden md:flex flex-col items-center gap-1 hover:text-[#216140] transition-colors relative group">
                        <Bookmark className="w-6 h-6 text-gray-700 group-hover:text-[#216140]" strokeWidth={1.5} />
                        <span className="text-[12px] font-semibold text-gray-700 hidden md:block">Wishlist</span>
                        {wishlistIds?.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm min-w-[18px] text-center">
                            {wishlistIds.length}
                          </span>
                        )}
                    </Link>

                    {/* Profile */}
                    {user ? (
                        <div className="hidden md:flex relative group cursor-pointer flex-col items-center gap-1 hover:text-[#216140] transition-colors">
                            <div className="w-6 h-6 rounded-full bg-[#216140] text-white flex items-center justify-center font-bold text-[11px] shadow-sm">
                                {user.username?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[12px] font-semibold text-gray-700 hidden md:block">Profile</span>

                            {/* Dropdown Menu */}
                            <div className="absolute right-[-20px] top-full pt-4 w-48 z-50 hidden group-hover:block">
                                <div className="bg-white rounded-xl shadow-xl py-2 border border-gray-100 transition-all duration-200">
                                    <Link href="/profile" className="block px-4 py-2.5 text-[14px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#216140]">My Profile</Link>
                                    <Link href="/wishlist" className="block px-4 py-2.5 text-[14px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#216140]">Wishlist</Link>
                                    <Link href="/order" className="block px-4 py-2.5 text-[14px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#216140]">Order History</Link>
                                    {user.role === "ADMIN" && (
                                        <>
                                            <hr className="my-1 border-gray-100" />
                                            <Link href="/admin/slides" className="block px-4 py-2.5 text-[14px] font-semibold text-green-700 hover:bg-green-50">Hero Slides</Link>
                                            <Link href="/admin/products" className="block px-4 py-2.5 text-[14px] font-semibold text-green-700 hover:bg-green-50">Product Images</Link>
                                        </>
                                    )}
                                    <hr className="my-1 border-gray-100" />
                                    <button
                                        onClick={async () => { await AUTH_API.logout(); setUser(null); router.push('/login'); }}
                                        className="w-full text-left px-4 py-2 text-[14px] font-semibold text-red-600 hover:bg-red-50 transition-colors">
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link href="/login" className="hidden md:flex flex-col items-center gap-1 hover:text-[#216140] transition-colors group">
                            <User className="w-6 h-6 text-gray-700 group-hover:text-[#216140]" strokeWidth={1.5} />
                            <span className="text-[12px] font-semibold text-gray-700 hidden md:block">Login</span>
                        </Link>
                    )}

                    {/* Cart */}
                    <Link href='/cart' className="flex flex-col items-center gap-1 hover:text-[#216140] transition-colors relative group">
                        <ShoppingCart className="w-6 h-6 text-gray-700 group-hover:text-[#216140]" strokeWidth={1.5} />
                        <span className="text-[12px] font-semibold text-gray-700 hidden md:block">Cart</span>
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-[#F59E0B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm min-w-[18px] text-center">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* Mobile Hamburger */}
                    <div className="flex lg:hidden items-center relative -mr-2">
                        <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 focus:outline-none z-50" aria-label="Toggle Menu">
                            <Hamburger toggled={isOpen} toggle={setIsOpen} color="#216140" size={24} rounded />
                        </button>
                        {isOpen && (
                            <ul className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100">
                                {user && (
                                    <li className="px-4 py-3 border-b border-gray-50 mb-1">
                                        <div className="text-[11px] text-gray-500">Welcome</div>
                                        <div className="font-bold text-gray-900">{user.username}</div>
                                    </li>
                                )}
                                <li className="px-2">
                                    <Link href="/" className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg">Home</Link>
                                </li>
                                <li className="px-2">
                                    <Link href="/wishlist" className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between">
                                        Wishlist
                                        {wishlistIds?.length > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                {wishlistIds.length}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                                <li className="px-2">
                                    <Link href="/contact" className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg">Contact Us</Link>
                                </li>
                                {user ? (
                                    <>
                                        <li className="px-2 border-t border-gray-100 mt-1 pt-1">
                                            <Link href="/profile" className="block px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg">Profile</Link>
                                        </li>
                                        {user.role === "ADMIN" && (
                                            <li className="px-2">
                                                <Link href="/admin/products" className="block px-4 py-2.5 text-sm font-bold text-green-700 hover:bg-green-50 rounded-lg">Admin Panel</Link>
                                            </li>
                                        )}
                                        <li className="px-2 border-t border-gray-100 mt-1 pt-1">
                                            <button onClick={async () => { await AUTH_API.logout(); setUser(null); router.push('/login'); }} className="w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg">Logout</button>
                                        </li>
                                    </>
                                ) : (
                                    <li className="px-2 border-t border-gray-100 mt-1 pt-1">
                                        <Link href="/login" className="block px-4 py-2.5 text-sm font-bold text-[#216140] hover:bg-gray-50 rounded-lg">Login / Register</Link>
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            </header>

            {/* Bottom Tier: Dynamic Category Scroll */}
            <div className="border-t border-gray-100">
                <div className="max-w-[1400px] mx-auto overflow-x-auto no-scrollbar">
                    <div className="flex items-center px-4 md:px-10 py-3 gap-6 min-w-max">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                <Leaf className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="text-[14px] font-bold text-gray-800 group-hover:text-purple-700 transition-colors">All</span>
                        </Link>
                        
                        {categories.map((cat) => (
                            <Link key={cat.id} href={`/category/${cat.slug}`} className="flex items-center gap-2 group">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-[#216140] transition-colors shrink-0">
                                    {cat.image_url ? (
                                        <Image src={cat.image_url} alt={cat.name} width={32} height={32} className="object-cover w-full h-full" />
                                    ) : (
                                        <Leaf className="w-4 h-4 text-gray-400 group-hover:text-[#216140]" />
                                    )}
                                </div>
                                <span className="text-[14px] font-semibold text-gray-700 group-hover:text-[#216140] transition-colors whitespace-nowrap">{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            
        </div>
    );
}
