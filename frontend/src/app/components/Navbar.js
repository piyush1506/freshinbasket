"use client";
import { useState, useEffect, useRef, useCallback, startTransition } from "react";
import { createPortal } from "react-dom";
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

export default function Navbar({ item, hideCategories = false, sectionTabs = null, customCategories = null }) {
    const { cartCount, user: contextUser, setUser, wishlistIds } = useCart();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const user = mounted ? (contextUser ?? getUser()) : null;
    const displayName = user ? (user.username || user.phone_number || "User") : "";
    const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : "";
	
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
        if (hideCategories || customCategories) return;
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
    }, [hideCategories, customCategories]);

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
        <div className="flex flex-col">
            {/* Top Tier: Logo, Location, Search, Profile, Cart */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-10 py-3 max-w-[1400px] w-full mx-auto gap-4 md:gap-8" aria-label="Main navigation">
                
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
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" aria-hidden="true" />
                        <input
                            type="text"
                            placeholder="Search for vegetables, fruits..."
                            aria-label="Search products"
                            value={searchQuery}
                            onChange={handleSearchQueryChange}
                            onKeyDown={handleSearch}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#F8F8F8] border border-gray-200 rounded-lg text-[14px] font-medium text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#216140] transition-all shadow-inner"
                            suppressHydrationWarning
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
                        <div className="hidden md:flex relative group cursor-pointer flex-col items-center gap-1 hover:text-[#216140] transition-colors" role="button" tabIndex={0} aria-haspopup="true" aria-label="User profile menu">
                            <div className="w-6 h-6 rounded-full bg-[#216140] text-white flex items-center justify-center font-bold text-[11px] shadow-sm">
                                {displayInitial}
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

                    {/* Mobile Hamburger Button */}
                    <div className="flex lg:hidden items-center relative -mr-2 z-[60]">
                        <button onClick={() => setIsOpen(!isOpen)} className="p-2 focus:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={isOpen}>
                            <Hamburger toggled={isOpen} toggle={setIsOpen} color={isOpen ? "#000000" : "#216140"} size={24} rounded label="Toggle navigation menu" />
                        </button>
                    </div>

                    {mounted && createPortal(
                        <>
                            {/* Mobile Menu Backdrop */}
                            <div 
                                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
                                onClick={() => setIsOpen(false)}
                            />

                            {/* Mobile Menu Side Drawer */}
                            <nav className={`fixed top-0 bottom-0 right-0 w-[85%] max-w-[340px] bg-white z-[1000] lg:hidden shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} aria-label="Mobile navigation" role="navigation">
                                
                                {/* Drawer Header */}
                                <div className="pt-16 pb-6 px-6 bg-gradient-to-br from-green-50 to-white border-b border-gray-100">
                                    {user ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-[#216140] text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white shrink-0">
                                                {displayInitial}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-500 font-medium">Welcome back,</p>
                                                <p className="font-bold text-gray-900 text-lg truncate w-full">{displayName}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-white shadow-sm shrink-0">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-lg leading-tight">Guest User</p>
                                                <p className="text-xs text-[#216140] font-medium mt-0.5">Login to order</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Drawer Body - Scrollable Links */}
                                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                                    <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                                        <Search className="w-5 h-5 text-gray-400" />
                                        Home
                                    </Link>
                                    <Link href="/wishlist" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 text-[15px] font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Bookmark className="w-5 h-5 text-gray-400" />
                                            Wishlist
                                        </div>
                                        {wishlistIds?.length > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                                                {wishlistIds.length}
                                            </span>
                                        )}
                                    </Link>
                                    <Link href="/order" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                                        <Leaf className="w-5 h-5 text-gray-400" />
                                        My Orders
                                    </Link>
                                    <Link href="/contact" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                                        <Heart className="w-5 h-5 text-gray-400" />
                                        Contact Us
                                    </Link>
                                    {user && user.role === "ADMIN" && (
                                        <Link href="/admin/products" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-[15px] font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors mt-2">
                                            <User className="w-5 h-5 text-green-600" />
                                            Admin Panel
                                        </Link>
                                    )}
                                </div>

                                {/* Drawer Footer */}
                                <div className="p-4 border-t border-gray-100 bg-gray-50 pb-safe">
                                    {user ? (
                                        <div className="space-y-2">
                                            <Link href="/profile" onClick={() => setIsOpen(false)} className="flex items-center justify-center w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors">
                                                View Profile
                                            </Link>
                                            <button onClick={async () => { await AUTH_API.logout(); setUser(null); setIsOpen(false); router.push('/login'); }} className="flex items-center justify-center w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors">
                                                Logout
                                            </button>
                                        </div>
                                    ) : (
                                        <Link href="/login" onClick={() => setIsOpen(false)} className="flex items-center justify-center w-full bg-[#216140] text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-green-800 transition-colors">
                                            Login / Register
                                        </Link>
                                    )}
                                </div>
                            </nav>
                        </>,
                        document.body
                    )}
                </div>
            </header>

            {/* Section Tabs (Non-sticky, scrolls away) */}
            {sectionTabs}

            {/* Bottom Tier: Dynamic Category Scroll */}
            {!hideCategories && (
                <nav className="sticky top-[64px] md:top-[72px] z-40 bg-white border-t border-b border-gray-100 shadow-sm" aria-label="Product categories">
                    <div className="max-w-[1400px] mx-auto overflow-x-auto no-scrollbar">
                        <div className="flex items-center px-4 md:px-10 py-3 gap-6 min-w-max">
                            <Link href="/" className="flex items-center gap-2 group">
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                    <Leaf className="w-4 h-4 text-purple-600" />
                                </div>
                                <span className="text-[14px] font-bold text-gray-800 group-hover:text-purple-700 transition-colors">All</span>
                            </Link>
                            
                            {(customCategories || categories).map((cat) => (
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
                </nav>
            )}
            
        </div>
    );
}
