"use client";
import { useState } from "react";
import SectionTabs from "./SectionTabs";
import CategoryNav from "./CategoryNav";
import Vegetables from "./vegetables";
import Hero from "./hero";
import Navbar from "./Navbar";

export default function HomeSections({ sections = [], children }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!sections || sections.length === 0) return null;

  const activeSection = sections[activeIndex] || sections[0];
  const activeCategories = activeSection?.categories || [];
  const activeSlides = activeSection?.slides || [];

  return (
    <>
      {/* Dynamic Header with inline Section Tabs & dynamic category links */}
      <Navbar
        sectionTabs={
          <SectionTabs
            sections={sections}
            activeIndex={activeIndex}
            onTabChange={setActiveIndex}
          />
        }
        customCategories={activeCategories}
      />

      {children}

      {/* Hero Section dynamically showing active section's slides */}
      <Hero slides={activeSlides} />

      {/* Category Navigation for the active section with top margin */}
      <div className="mt-6 sm:mt-8">
        <CategoryNav initialCategories={activeCategories} sectionName={activeSection?.name} />
      </div>

      {/* Product carousels for the active section with top margin */}
      <div className="mt-4">
        <Vegetables initialSections={activeCategories} sectionName={activeSection?.name} />
      </div>
    </>
  );
}
