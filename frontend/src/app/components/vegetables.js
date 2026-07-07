"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import VegetableCard from "./VegetableCard";
import { ArrowRight } from "lucide-react";

function useGridColumns() {
  const [cols, setCols] = useState(6);

  useEffect(() => {
    const updateCols = () => {
      const width = window.innerWidth;
      if (width < 640) setCols(2);
      else if (width < 768) setCols(3);
      else if (width < 1024) setCols(4);
      else if (width < 1280) setCols(5);
      else setCols(6);
    };
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  return cols;
}

function CategorySection({ s, index }) {
  const cols = useGridColumns();
  const [visibleRows, setVisibleRows] = useState(2);
  
  const visibleCount = visibleRows * cols;
  const hasMore = s.products.length > visibleCount;

  return (
    <section
      key={s.slug}
      id={`cat-${s.slug}`}
      className={`py-16 px-4 sm:px-8 md:px-16 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-green-900 mb-2 capitalize">{s.name}</h2>
            {s.description && (
              <p className="text-gray-500 text-sm">{s.description}</p>
            )}
          </div>
          <Link
            href={`/category/${s.slug}`}
            className="text-sm font-semibold text-green-600 hover:text-green-700 flex items-center"
          >
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {s.products.slice(0, visibleCount).map((item) => (
            <VegetableCard key={item.id} item={item} isHome={true} />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => setVisibleRows(prev => prev + 3)}
              className="bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-10 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              See More
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Vegetables({ initialSections = [], sectionName = "" }) {
  const [shuffledProducts, setShuffledProducts] = useState([]);
  const [prevSectionName, setPrevSectionName] = useState(sectionName);
  
  const cols = useGridColumns();
  const [visibleGeneralRows, setVisibleGeneralRows] = useState(3);

  // Adjust state during rendering when sectionName changes (standard React pattern)
  if (sectionName !== prevSectionName) {
    setPrevSectionName(sectionName);
    setVisibleGeneralRows(3);
  }

  // Defer product shuffling to requestAnimationFrame to keep rendering pure
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!initialSections || initialSections.length === 0) {
        setShuffledProducts([]);
        return;
      }

      const productsMap = new Map();
      initialSections.forEach(category => {
        if (category.products && Array.isArray(category.products)) {
          category.products.forEach(product => {
            productsMap.set(product.id, product);
          });
        }
      });

      const productsList = Array.from(productsMap.values());

      const shuffled = [...productsList];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      setShuffledProducts(shuffled);
    });

    return () => cancelAnimationFrame(frame);
  }, [initialSections]);

  if (initialSections.length === 0) return null;

  const visibleGeneralCount = visibleGeneralRows * cols;
  const hasMoreGeneral = shuffledProducts.length > visibleGeneralCount;

  return (
    <>
      {/* 1. Shuffled Mix Grid (All Products Combined) */}
      {shuffledProducts.length > 0 && (
        <section className="py-12 px-4 sm:px-8 md:px-16 bg-[#FDFDFD]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col mb-10">
              <h2 className="text-3xl font-bold text-green-955 mb-2 capitalize">
                {sectionName ? `Fresh Picks in ${sectionName}` : "Our Fresh Harvest"}
              </h2>
              <p className="text-gray-500 text-sm">Explore organic and high-quality products</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {shuffledProducts.slice(0, visibleGeneralCount).map((item) => (
                <VegetableCard key={item.id} item={item} isHome={true} />
              ))}
            </div>

            {hasMoreGeneral && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setVisibleGeneralRows((prev) => prev + 3)}
                  className="bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-10 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  See More
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Nice Section Divider */}
      <div className="border-t border-gray-100 max-w-7xl mx-auto my-4" />

      {/* 2. Structured Products organized by Categories */}
      {initialSections.map((s, i) => (
        <CategorySection key={s.slug} s={s} index={i} />
      ))}
    </>
  );
}
