 "use client";
 import { useState, useEffect, useRef, useCallback } from "react";
 import Link from "next/link";
 import { ArrowRight } from "lucide-react";
 import { useRouter } from "next/navigation";
 
 export default function Footer() {

     return (
 <footer className="border-t border-gray-200 bg-white pt-16 pb-8 px-4 sm:px-8 md:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="text-xl font-bold text-green-700 mb-4">Freshinbasket</div>
            <p className="text-gray-500 text-xs leading-relaxed mb-4">
              Sustainable, organic, and direct from our fields to your table. Your health is our harvest.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/about" className="hover:text-green-600">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-green-600">Contact</Link></li>
              <li><Link href="/contact" className="hover:text-green-600">Support</Link></li>
              <li><Link href="/privacy" className="hover:text-green-600">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-green-600">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/category/vegetables" className="hover:text-green-600">All Vegetables</Link></li>
              <li><Link href="/category/fruits" className="hover:text-green-600">Seasonal Fruits</Link></li>
              <li className="flex gap-4 pt-1">
                <a 
                  href="http://facebook.com/people/Fresh-in-Basket/61590414913160/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-green-600 transition-colors"
                  title="Facebook"
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
                    className="w-4 h-4"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a 
                  href="https://www.instagram.com/freshinbasket_/?hl=en" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-green-600 transition-colors"
                  title="Instagram"
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
                    className="w-4 h-4"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase">Newsletter</h4>
            <p className="text-gray-500 text-xs mb-4">Get seasonal recipes and farm updates.</p>
            <div className="flex">
              <input type="email" placeholder="Email addr..." className="bg-gray-50 border border-gray-200 rounded-l-lg px-3 py-2 text-sm w-full focus:outline-none" />
              <button className="bg-green-900 hover:bg-green-800 text-white px-4 py-2 rounded-r-lg transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-400">
          &copy; 2026 Freshinbasket. Organic freshness for your kitchen.
        </div>
      </footer>
     )
    }