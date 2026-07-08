"use client";
import { Star, CheckCircle2 } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: "Priyanka Choudhary",
      initials: "PC",
      location: "Bhilwara",
      time: "2 days ago",
      comment: "Extremely fresh vegetables! The bhindi and green chillies were so crisp. Got it delivered right on time in Bhilwara. Highly recommended!",
      rating: 5,
      avatarBg: "from-green-400 to-emerald-600"
    },
    {
      id: 2,
      name: "Aditya Soni",
      initials: "AS",
      location: "Bhilwara",
      time: "5 days ago",
      comment: "Very convenient app. The pricing is better than the local mandi, and they clean the vegetables before packaging. Saved me so much time!",
      rating: 5,
      avatarBg: "from-emerald-400 to-teal-600"
    },
    {
      id: 3,
      name: "Meenakshi Vyas",
      initials: "MV",
      location: "Bhilwara",
      time: "1 week ago",
      comment: "Freshinbasket is a game changer for fresh fruits. The apples and seasonal mangoes were incredibly sweet. Verified organic quality.",
      rating: 5,
      avatarBg: "from-green-500 to-teal-700"
    },
    {
      id: 4,
      name: "Rajesh Mewara",
      initials: "RM",
      location: "Bhilwara",
      time: "1 week ago",
      comment: "Ordering daily items has become a breeze. Love their slot delivery system and prompt support. The quality is always top-notch.",
      rating: 5,
      avatarBg: "from-teal-400 to-emerald-600"
    },
    {
      id: 5,
      name: "Sanjay Sharma",
      initials: "SS",
      location: "Bhilwara",
      time: "2 weeks ago",
      comment: "Their support is amazing, directly helped me choose custom box items on WhatsApp. Mandi rates right at my doorstep!",
      rating: 5,
      avatarBg: "from-emerald-500 to-green-600"
    },
    {
      id: 6,
      name: "Kiran Jain",
      initials: "KJ",
      location: "Bhilwara",
      time: "3 weeks ago",
      comment: "Great packaging and timely delivery. The leafy greens were so fresh and without any chemicals. Best organic delivery in town.",
      rating: 5,
      avatarBg: "from-green-400 to-teal-600"
    }
  ];

  return (
    <section id="testimonials" className="py-20 px-4 sm:px-8 md:px-16 max-w-7xl mx-auto" aria-label="Customer testimonials">
      <div className="text-center mb-12">
        <span className="bg-green-50 text-[#216140] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
          Reviews
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-4 tracking-tight">
          Loved by 10,000+ Happy Kitchens
        </h2>
        <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          See what our regular customers in Bhilwara say about our farm-fresh quality, packaging, and timely delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Header: User Info & Time */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${item.avatarBg} text-white flex items-center justify-center font-extrabold text-sm shadow-sm`}>
                    {item.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">
                      {item.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {item.location}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {item.time}
                </span>
              </div>

              {/* Rating stars */}
              <div className="flex gap-0.5 mb-3" role="img" aria-label={`${item.rating} out of 5 stars`}>
                {[...Array(item.rating)].map((_, index) => (
                  <Star
                    key={index}
                    size={14}
                    className="fill-amber-400 text-amber-400"
                    aria-hidden="true"
                  />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                &ldquo;{item.comment}&rdquo;
              </p>
            </div>

            {/* Verification Footer (Zepto/Blinkit verified shopper style) */}
            <div className="mt-4 pt-3 border-t border-t-gray-100 flex items-center gap-1.5 text-[#216140]">
              <CheckCircle2 size={13} className="fill-current text-white" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Verified Purchase
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
