"use client";
import { useState, useRef, useEffect } from "react";

export default function SectionTabs({ sections = [], activeIndex = 0, onTabChange }) {
  const [activeStyle, setActiveStyle] = useState({});
  const tabRefs = useRef([]);

  useEffect(() => {
    const activeTab = tabRefs.current[activeIndex];
    if (activeTab) {
      setActiveStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
        height: activeTab.offsetHeight,
      });
    }
  }, [activeIndex, sections]);

  if (!sections || sections.length === 0) return null;

  return (
    <div className="relative z-20 bg-[#FDFDFD] w-full overflow-hidden transition-all duration-300">
      
      {/* MOBILE ONLY VIEW: iOS-Style Centered Segmented Control */}
      <div className="flex md:hidden justify-center py-2 px-4 border-b border-gray-100/80">
        <div className="relative flex items-center p-1 bg-gray-100/80 border border-gray-200/40 rounded-full shadow-inner gap-0.5" role="tablist" aria-label="Section navigation">
          {/* Animated sliding background pill */}
          <div
            className="absolute bg-[#2470f1] rounded-full transition-all duration-300 ease-out shadow-sm shadow-[#2470f1]/25 z-0"
            style={{
              left: activeStyle.left || 4,
              width: activeStyle.width || 0,
              height: activeStyle.height || 0,
            }}
            aria-hidden="true"
          />

          {sections.map((section, index) => {
            const isActive = activeIndex === index;
            const categoryCount = section.categories?.length || 0;
            return (
              <button
                key={section.id || index}
                ref={(el) => (tabRefs.current[index] = el)}
                onClick={() => onTabChange(index)}
                role="tab"
                aria-selected={isActive}
                id={`section-tab-${section.id || index}`}
                aria-label={`${section.name}, ${categoryCount} categories`}
                className={`relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-extrabold tracking-wide transition-all duration-300 cursor-pointer select-none z-10 focus:outline-none min-w-[140px]
                  ${
                    isActive
                      ? "text-white scale-[1.02]"
                      : "text-gray-600 hover:text-gray-900"
                  }
                `}
              >
                {section.icon && (
                  <span className={`text-base transition-transform duration-300 ${isActive ? 'scale-110' : 'opacity-85'}`} aria-hidden="true">
                    {section.icon}
                  </span>
                )}
                <span className="whitespace-nowrap font-black" aria-hidden="true">{section.name}</span>
                
                {/* Count badge — aria-hidden since label is on parent button */}
                <span
                  className={`ml-1.5 text-[9px] font-black px-2 py-0.5 rounded-full transition-all duration-300
                    ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-500"
                    }
                  `}
                  aria-hidden="true"
                >
                  {categoryCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DESKTOP ONLY VIEW: Minimalist, spacious left-aligned border tabs */}
      <div className="hidden md:block max-w-[1400px] mx-auto px-10 pt-4">
        <div className="flex items-center gap-10 border-b border-gray-100" role="tablist" aria-label="Section navigation">
          {sections.map((section, index) => {
            const isActive = activeIndex === index;
            const categoryCount = section.categories?.length || 0;
            return (
              <button
                key={section.id || index}
                onClick={() => onTabChange(index)}
                role="tab"
                aria-selected={isActive}
                id={`section-tab-desktop-${section.id || index}`}
                aria-label={`${section.name}, ${categoryCount} categories`}
                className={`relative pb-3 text-sm font-black tracking-wider transition-all duration-200 cursor-pointer select-none focus:outline-none flex items-center gap-2
                  ${
                    isActive
                      ? "text-[#2470f1]"
                      : "text-gray-500 hover:text-gray-800"
                  }
                `}
              >
                {section.icon && (
                  <span className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : 'opacity-80'}`} aria-hidden="true">
                    {section.icon}
                  </span>
                )}
                <span className="whitespace-nowrap font-black uppercase text-[13px]" aria-hidden="true">{section.name}</span>
                
                {/* Count badge — aria-hidden since label is on parent button */}
                <span
                  className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-all duration-200
                    ${
                      isActive
                        ? "bg-[#2470f1]/10 text-[#2470f1]"
                        : "bg-gray-100 text-gray-450"
                    }
                  `}
                  aria-hidden="true"
                >
                  {categoryCount}
                </span>

                {/* Active Indicator Underline */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#2470f1] rounded-t-full animate-fade-in" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
