"use client";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css/effect-fade";
import { Star } from "lucide-react";

export default function Testimonials() {
  const review = [
    {
      id: 1,
      name: 'Jane Doe',
      comment: 'The quality of the produce is just unmatched. You can literally smell the soil and freshness the moment you open the box. It has transformed my cooking completely.',
      rating: 5
    },
    {
      id: 2,
      name: 'John Smith',
      comment: 'very good fruits',
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="py-16 px-4 sm:px-8 md:px-16 text-center max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-green-900 mb-10">What Our Customer Say</h2>
      <Swiper
        slidesPerView={1}
        loop={true}
        autoHeight={true}
        effect="creative"
        fadeEffect={{ crossFade: true }}
        speed={1200}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        modules={[Autoplay, EffectFade]}
      >
        {review.map((item) => (
          <SwiperSlide key={item.id}>
            <div className="bg-white shadow-lg rounded-2xl p-6 text-center">
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(item.rating)].map((_, index) => (
                  <Star
                    key={index}
                    className="w-5 h-5 fill-green-600 text-green-600"
                  />
                ))}
              </div>

              <p className="text-lg italic text-gray-700">
                "{item.comment}"
              </p>

              <h4 className="font-bold text-green-900 mt-4">
                {item.name}
              </h4>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
