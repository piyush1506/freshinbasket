"use client";
import { Leaf, Heart, ShieldCheck, Truck } from "lucide-react";

import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      {/* Hero Section */}
      <section className="relative bg-green-900 py-24 sm:py-32 px-4 sm:px-8 md:px-16 overflow-hidden mt-[72px]">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')] mix-blend-overlay"></div>
        <div className="relative max-w-4xl mx-auto text-center z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
            Nurturing Health, <span className="text-green-300">Naturally.</span>
          </h1>
          <p className="text-lg sm:text-xl text-green-100 max-w-2xl mx-auto leading-relaxed">
            We believe that the best food comes straight from the earth. No compromises—just pure freshness delivered directly to your doorstep.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-4 sm:px-8 md:px-16 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-green-900 tracking-tight">Our Story</h2>
            <div className="w-20 h-1.5 bg-green-500 rounded-full"></div>
            <p className="text-gray-600 text-lg leading-relaxed">
              Freshinbasket started with a simple, powerful idea: everyone deserves access to healthy, sustainably grown food. What began as a small community initiative has blossomed into a network of dedicated local farmers.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              We bypass the middleman and partner directly with passionate growers. This ensures that our produce is harvested at its peak and brought to you while it's still brimming with flavor and vital nutrients.
            </p>
          </div>
          <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl group">
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80" 
              alt="Farm fresh vegetables" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 px-4 sm:px-8 md:px-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-green-900 tracking-tight mb-4">Our Core Values</h2>
            <p className="text-gray-600 text-lg">The principles that guide every seed we plant and every box we deliver.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 group">
              <div className="w-14 h-14 bg-green-100 text-green-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                <Leaf className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Farm Fresh</h3>
              <p className="text-gray-500 leading-relaxed text-sm">We source our produce directly from trusted local farms to ensure you receive the freshest and highest quality vegetables and fruits.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 group">
              <div className="w-14 h-14 bg-green-100 text-green-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community First</h3>
              <p className="text-gray-500 leading-relaxed text-sm">We empower local farmers by providing fair trade compensation and fostering long-term, sustainable partnerships.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 group">
              <div className="w-14 h-14 bg-green-100 text-green-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Unmatched Quality</h3>
              <p className="text-gray-500 leading-relaxed text-sm">Every fruit and vegetable goes through a rigorous quality check before it ever reaches your box.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 group">
              <div className="w-14 h-14 bg-green-100 text-green-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Farm to Door</h3>
              <p className="text-gray-500 leading-relaxed text-sm">Enjoy the luxury of peak-freshness with our rapid delivery network straight from the fields.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-4 sm:px-8 md:px-16 bg-green-900 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')]"></div>
        <div className="relative max-w-3xl mx-auto z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">Ready to taste the difference?</h2>
          <p className="text-green-100 text-lg mb-10">
            Join thousands of families who have already made the switch to fresh and locally-sourced produce.
          </p>
          <Link href="/" className="inline-block bg-white text-green-900 font-bold text-lg px-8 py-4 rounded-full shadow-lg hover:bg-green-50 hover:scale-105 transition-all duration-300">
            Start Shopping Now
          </Link>
        </div>
      </section>

      
    </div>
  );
}
