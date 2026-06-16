"use client";
import { useState, useEffect, useRef, useCallback, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { Search, ShoppingCart, Leaf, ChevronDown, User } from "lucide-react";
import { Squash as Hamburger } from 'hamburger-react';
import { clearAuth, AUTH_API } from "@/lib/auth";

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
    const { cartCount, user, setUser } = useCart();
    const router = useRouter();
	
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);
    const suggestionCacheRef = useRef(new Map());
    const allSuggestionsRef = useRef([]);

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
                    `${base}/api/products/search/?limit=${PRELOAD_SUGGESTION_LIMIT}&suggest=1`,
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
                    `${base}/api/products/search/?limit=${PRELOAD_SUGGESTION_LIMIT}&index=1`,
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
                    `${base}/api/products/search/?q=${encodeURIComponent(query)}&limit=${SUGGESTION_LIMIT}&suggest=1`,
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
        <div className="bg-[#FCFCFC] border-b border-gray-100 relative">
            <header className="flex items-center justify-between px-6 md:px-10 py-4 max-w-[1400px] mx-auto sticky top-0 z-50">
                
                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-2.5 shrink-0">
                    <div className="w-9 h-9 bg-[#216140] rounded-xl flex items-center justify-center shadow-sm">
                        <Leaf className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="hidden md:block text-xl font-extrabold text-[#113B26] tracking-tight">Freshinbasket</span>
                </Link>

                {/* Search Bar (Now visible on Mobile) */}
                <div className="flex-1 max-w-md mx-4 md:mx-8" ref={searchRef}>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search vegetables and fruits"
                            aria-label="Search vegetables"
                            value={searchQuery}
                            onChange={handleSearchQueryChange}
                            onKeyDown={handleSearch}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            className="w-full pl-10 pr-4 py-2 bg-[#F1F3F2] rounded-full text-[13px] md:text-[14px] font-medium text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#216140]/20 transition-all"
                        />

                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
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

                {/* Navigation Links */}
                <nav className="hidden lg:flex items-center space-x-8 text-[14px] font-bold text-[#4B5563]">
                    <Link href="/" className="text-[#216140] border-b-2 border-[#216140] pb-1">Home</Link>
                    <Link href="/category/fruits" className="hover:text-[#216140] transition-colors">Fruits</Link>
                    <Link href="/category/vegetables" className="hover:text-[#216140] transition-colors">Vegetables</Link>
                    <Link href="/contact" className="hover:text-[#216140] transition-colors">Contact Us</Link>
                </nav>

                {/* Right Side Icons & Profile */}
                <div className="flex items-center space-x-3 md:space-x-6 ml-auto pl-6">
                    {/* Cart */}
                    <Link href='/cart' className="relative hover:opacity-80 transition-opacity shrink-0">
                        <ShoppingCart className="w-[20px] h-[20px] md:w-[22px] md:h-[22px] text-gray-800" strokeWidth={2.2} />
                        <span className="absolute -top-1.5 -right-2 bg-[#F59E0B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm min-w-[18px] text-center">
                            {cartCount}
                        </span>
                    </Link>

                    {/* User Profile Pill */}
                    {user ? (
                        <div className="relative group cursor-pointer hidden md:block">
                            <div className="flex items-center gap-3 bg-[#F1F3F2] rounded-full py-1.5 px-2 pr-4 hover:bg-[#E5E7E5] transition-colors">
                                <div className="w-8 h-8 rounded-full bg-[#216140] text-white flex items-center justify-center font-bold text-sm shadow-inner">
                                    {user.username?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 font-semibold leading-tight">Welcome</span>
                                    <span className="text-[13px] font-extrabold text-gray-900 leading-tight">Hi, {user.username}</span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-500 ml-1" />
                            </div>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full pt-2 w-48 z-50 hidden group-hover:block">
                                <div className="bg-white rounded-xl shadow-xl py-2 border border-gray-100 transition-all duration-200">
                                <Link href="/profile" className="block px-4 py-2.5 text-[14px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#216140]">My Profile</Link>
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
                        <Link href="/login" className="hidden md:flex items-center gap-2 bg-[#216140] text-white px-5 py-2 rounded-full text-[14px] font-bold hover:bg-[#16432C] transition-colors">
                            <User size={16} /> Login
                        </Link>
                    )}

                    {/* Mobile Hamburger */}
                    <div className="flex lg:hidden items-center relative">
                        <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 focus:outline-none z-50 -mr-2" aria-label="Toggle Menu">
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
                                    <Link href="#home" className="block px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg">Home</Link>
                                </li>
                                <li className="px-2">
                                    <Link href="/category/vegetables" className="block px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg">vegetables</Link>
                                </li>
                                <li className="px-2">
                                    <Link href="/category/fruits" className="block px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg">Fruits</Link>
                                </li>
                                <li className="px-2">
                                    <Link href="/contact" className="block px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg">Contact Us</Link>
                                </li>
                                {user ? (
                                    <>
                                        <li className="px-2 border-t border-gray-100 mt-1 pt-1">
                                            <Link href="/profile" className="block px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg">Profile</Link>
                                        </li>
                                        <li className="px-2">
                                            <Link href="/order" className="block px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg">Orders</Link>
                                        </li>
                                        {user.role === "ADMIN" && (
                                            <li className="px-2">
                                                <Link href="/admin/products" className="block px-4 py-2.5 text-sm font-bold text-green-700 hover:bg-green-50 rounded-lg">Admin Panel</Link>
                                            </li>
                                        )}
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
        </div>
    );
}
