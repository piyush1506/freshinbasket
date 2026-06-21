"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from "swiper";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

const FALLBACK_SLIDES = [
  {
    id: 1,
    title: "Fresh Organic\nVegetables Every Day",
    subtitle: "Get farm-fresh vegetables delivered directly to your doorstep within 24 hours of harvest.",
    image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop",
    tag: "Organic",
    link: "/category/vegetables",
    button_text: "Shop Now",
    link_two: "",
    button_text_two: "View Offers",
  },
];

export default function Hero() {
  const [slides, setSlides] = useState(FALLBACK_SLIDES);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/home/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.slides && data.slides.length > 0) {
          setSlides(data.slides);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div id="home" className="bg-white shadow-sm relative">
      <Swiper
        modules={[Autoplay, EffectFade, Pagination]}
        effect="fade"
        loop={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        className="w-full h-[calc(100vh-72px)]"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <section className="relative w-full h-full">
              <img
                src={slide.image_url}
                alt={slide.title || "Hero slide"}
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-3xl">
                {slide.tag && (
                  <span className="bg-[#B4F044] text-green-900 text-xs font-bold px-3 py-1 rounded-full w-max mb-4 uppercase tracking-wider">
                    {slide.tag}
                  </span>
                )}
                <h1 className="text-4xl md:text-6xl font-extrabold text-white z-10 leading-tight mb-4 drop-shadow-lg whitespace-pre-line">
                  {slide.title}
                </h1>
                <p className="text-white/95 text-sm md:text-lg mb-8 max-w-lg drop-shadow-md font-medium">
                  {slide.subtitle}
                </p>
                <div className="flex space-x-4">
                  {slide.link && (
                    <Link
                      href={slide.link}
                      className="bg-[#B4F044] hover:bg-[#a1d63d] text-green-900 font-bold px-8 py-4 rounded-full flex items-center transition-all transform hover:scale-105 text-sm md:text-base shadow-xl"
                    >
                      {slide.button_text || "Shop Now"} <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  )}
                  {slide.link_two && (
                    <Link
                      href={slide.link_two}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold px-8 py-4 rounded-full transition-all text-sm md:text-base border border-white/40 shadow-xl"
                    >
                      {slide.button_text_two || "View Offers"}
                    </Link>
                  )}
                </div>
              </div>
            </section>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
