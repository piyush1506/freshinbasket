"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function MobileAppBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show on small screens (mobile)
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        const hidden = sessionStorage.getItem("hide_app_banner");
        if (!hidden) setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="md:hidden fixed bottom-20 sm:bottom-24 left-4 right-4 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-3 z-[9999] flex items-center justify-between pb-safe" role="region" aria-label="Download app banner">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#216140] rounded-xl flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white text-xl font-black">F</span>
        </div>
        <div>
          <p className="text-xs font-black text-gray-900 leading-tight">Freshinbasket App</p>
          <p className="text-[11px] font-medium text-gray-600 mt-0.5">Download our app for a better experience</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a 
          href="https://play.google.com/store/apps/details?id=in.freshinbasket.app&pcampaignid=web_share" 
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download Freshinbasket app on Google Play Store"
          className="bg-[#216140] hover:bg-green-800 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-sm min-h-[44px] flex items-center justify-center"
        >
          GET APP
        </a>
        <button 
          onClick={() => { setIsVisible(false); sessionStorage.setItem("hide_app_banner", "1"); }} 
          className="text-gray-400 p-2.5 hover:text-gray-600 bg-gray-50 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close app download banner"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
