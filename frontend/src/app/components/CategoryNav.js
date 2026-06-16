"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function CategoryNav({ initialCategories = [] }) {
  const categories = initialCategories;

  if (categories.length === 0) return null;

  return (
    <section className="py-8 px-4 sm:px-8 md:px-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-lg md:text-xl font-bold text-green-900 mb-5 text-center md:text-left">
          Shop by Category
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-7">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative h-28 sm:h-32 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >
              {cat.image_url ? (
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                  <span className="text-2xl opacity-30">🛒</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <h3 className="text-white text-xs sm:text-sm font-bold capitalize drop-shadow-lg">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="text-white/70 text-[10px] mt-0.5 line-clamp-1">{cat.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
