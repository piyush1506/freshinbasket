 "use client";
 import { useState, useEffect, useRef, useCallback } from "react";
 import Link from "next/link";
 import { ArrowRight } from "lucide-react";
 import { useRouter } from "next/navigation";
 
 export default function Footer() {

     return (
 <footer className="border-t border-gray-200 bg-white pt-16 pb-8 px-4 sm:px-8 md:px-16" aria-label="Site footer">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="text-xl font-bold text-green-700 mb-4">Freshinbasket</div>
            <p className="text-gray-600 text-xs leading-relaxed mb-6">
              Sustainable, organic, and direct from our fields to your table. Your health is our harvest.
            </p>
            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase">Download Our App</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Play Store Badge */}
              <a href="#" aria-label="Download Freshinbasket on Google Play Store" className="flex items-center justify-center gap-2 bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors w-max min-h-[44px]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5 fill-current"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
                <div className="text-left">
                  <div className="text-[8px] uppercase tracking-wider leading-none">GET IT ON</div>
                  <div className="text-sm font-bold leading-none mt-0.5">Google Play</div>
                </div>
              </a>
              {/* App Store Badge */}
              <a href="#" aria-label="Download Freshinbasket on Apple App Store" className="flex items-center justify-center gap-2 bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors w-max min-h-[44px]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-5 h-5 fill-current"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                <div className="text-left">
                  <div className="text-[8px] uppercase tracking-wider leading-none">Download on the</div>
                  <div className="text-sm font-bold leading-none mt-0.5">App Store</div>
                </div>
              </a>
            </div>
          </div>
          <nav aria-label="Quick links">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/about" className="hover:text-green-600 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-green-600 transition-colors">Contact</Link></li>
              <li><Link href="/contact#support" aria-label="Get customer support" className="hover:text-green-600 transition-colors">Support</Link></li>
              <li><Link href="/refund-policy" className="hover:text-green-600 transition-colors">Refund & Return Policy</Link></li>
              <li><Link href="/privacy" className="hover:text-green-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-green-600 transition-colors">Terms of Service</Link></li>
            </ul>
          </nav>
          <nav aria-label="Shop categories">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase">Shop</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/category/vegetables" className="hover:text-green-600 transition-colors">All Vegetables</Link></li>
              <li><Link href="/category/fruits" className="hover:text-green-600 transition-colors">Seasonal Fruits</Link></li>
              <li className="flex gap-4 pt-2">
                <a 
                  href="http://facebook.com/people/Fresh-in-Basket/61590414913160/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-green-600 transition-colors p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Visit Freshinbasket on Facebook"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a 
                  href="https://www.instagram.com/freshinbasket_/?hl=en" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-green-600 transition-colors p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Visit Freshinbasket on Instagram"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              </li>
            </ul>
          </nav>
          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase">Newsletter</h3>
            <p className="text-gray-600 text-xs mb-4">Get seasonal recipes and farm updates.</p>
            <div className="flex">
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input id="footer-email" type="email" placeholder="Email addr..." className="bg-gray-50 border border-gray-200 rounded-l-lg px-3 py-2 text-sm w-full focus:outline-none" suppressHydrationWarning />
              <button aria-label="Subscribe to newsletter" className="bg-green-900 hover:bg-green-800 text-white px-4 py-2 rounded-r-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-500">
          &copy; 2026 Freshinbasket. Organic freshness for your kitchen.
        </div>
      </footer>
     )
    }