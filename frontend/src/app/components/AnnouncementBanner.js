"use client";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { X } from "lucide-react";

export default function AnnouncementBanner() {
  const { storeSettings } = useCart();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if the backend says it's active and there is a message
    if (storeSettings?.is_announcement_active && storeSettings?.announcement_message) {
      // Check if user has previously dismissed it
      const hasDismissed = localStorage.getItem("hide_announcement");
      if (hasDismissed !== storeSettings.announcement_message) {
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
    }
  }, [storeSettings]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember that the user dismissed THIS specific message
    if (storeSettings?.announcement_message) {
      localStorage.setItem("hide_announcement", storeSettings.announcement_message);
    }
  };

  if (!isVisible || !storeSettings) return null;

  const bgColor = storeSettings.announcement_bg_color || "#0c831f";
  const textColor = storeSettings.announcement_text_color || "#ffffff";

  return (
    <div 
      className="relative w-full z-50 transition-all duration-300 ease-in-out"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-2.5 flex items-center justify-between">
        <div className="flex-1 flex justify-center text-[11px] sm:text-xs font-medium text-center px-4 sm:px-6">
          {storeSettings.announcement_message}
        </div>
        <button 
          onClick={handleDismiss}
          className="shrink-0 rounded-md p-1 hover:bg-black/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
