"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

const FALLBACK_SLIDES = [
  {
    id: 1,
    title: "Fresh Organic\nVegetables Every Day",
    subtitle: "Get farm-fresh vegetables delivered directly to your doorstep within 24 hours of harvest.",
    image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=60&auto=format&fit=crop",
    tag: "Organic",
    link: "/category/vegetables",
    button_text: "Shop Now",
    link_two: "",
    button_text_two: "View Offers",
  },
];

// Each text element animates in with a staggered delay
function AnimatedContent({ slide }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-8 md:px-16 max-w-3xl">
      {slide.tag && (
        <span
          className="bg-[#B4F044] text-green-900 text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-full w-max mb-2 sm:mb-4 uppercase tracking-wider animate-hero-tag"
        >
          {slide.tag}
        </span>
      )}
      <h1
        className="text-2xl sm:text-4xl md:text-6xl font-extrabold z-10 leading-tight mb-2 sm:mb-4 drop-shadow-lg whitespace-pre-line animate-hero-title"
        style={
          slide.text_color
            ? { color: slide.text_color }
            : {
                background: "linear-gradient(135deg, #ffffff 40%, #B4F044 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }
        }
      >
        {slide.title}
      </h1>
      <p
        className="text-xs sm:text-sm md:text-lg mb-4 sm:mb-8 max-w-lg drop-shadow-md font-medium animate-hero-subtitle line-clamp-2 sm:line-clamp-none"
        style={slide.text_color ? { color: slide.text_color } : { color: "#d4f5b0" }}
      >
        {slide.subtitle}
      </p>
      <div className="flex space-x-2 sm:space-x-4 animate-hero-buttons">
        {slide.link && (
          <Link
            href={slide.link}
            className="bg-[#B4F044] hover:bg-[#a1d63d] text-green-900 font-bold px-4 py-2 sm:px-8 sm:py-4 rounded-full flex items-center transition-all transform hover:scale-105 text-xs sm:text-sm md:text-base shadow-xl"
          >
            {slide.button_text || "Shop Now"} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" aria-hidden="true" />
          </Link>
        )}
        {slide.link_two && (
          <Link
            href={slide.link_two}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold px-4 py-2 sm:px-8 sm:py-4 rounded-full transition-all text-xs sm:text-sm md:text-base border border-white/40 shadow-xl"
          >
            {slide.button_text_two || "View Offers"}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Hero({ slides: initialSlides }) {
  const slides = (initialSlides && initialSlides.length > 0) ? initialSlides : FALLBACK_SLIDES;
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div id="home" className="bg-white shadow-sm relative">
      <Swiper
        modules={[Autoplay, EffectFade, Pagination]}
        effect="fade"
        loop={true}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="w-full h-[220px] sm:h-[400px] md:h-[calc(100vh-72px)]"
        a11y={{
          prevSlideMessage: 'Previous slide',
          nextSlideMessage: 'Next slide',
          paginationBulletMessage: 'Go to slide {{index}}',
        }}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.id}>
            <section className="relative w-full h-full" aria-label={slide.title || "Hero banner"}>
              <Image
                src={slide.image_url}
                alt={slide.title || "Hero slide"}
                fill
                style={{ objectFit: "cover" }}
                sizes="100vw"
                priority={index === 0}
                fetchPriority={index === 0 ? "high" : "auto"}
                quality={50}
              />

              {/* Re-mount AnimatedContent on each slide change to re-trigger animations */}
              <AnimatedContent key={`${slide.id}-${activeIndex}`} slide={slide} />
            </section>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
