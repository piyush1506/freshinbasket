"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import VegetableCard from "./VegetableCard";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Autoplay } from "swiper";
import { ArrowRight } from "lucide-react";

export default function Vegetables({ initialSections = [] }) {
  const sections = initialSections;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((s, i) => (
        <section
          key={s.slug}
          id={`cat-${s.slug}`}
          className={`py-16 px-4 sm:px-8 md:px-16 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
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

            {!mounted ? (
              /* SSR fallback: show products in a regular grid until Swiper hydrates */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {s.products.slice(0, 5).map((item) => (
                  <VegetableCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <Swiper
                key={s.slug}
                slidesPerView={2}
                spaceBetween={16}
                autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }}
                modules={[Autoplay]}
                breakpoints={{
                  640: { slidesPerView: 3, spaceBetween: 24 },
                  768: { slidesPerView: 4, spaceBetween: 24 },
                  1024: { slidesPerView: 5, spaceBetween: 24 },
                }}
              >
                {s.products.map((item) => (
                  <SwiperSlide key={item.id} style={{ width: "auto" }}>
                    <VegetableCard item={item} />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        </section>
      ))}
    </>
  );
}
