import Image from "next/image";
import Link from "next/link";
import Footer from './components/Footer';
import Navbar from "./components/Navbar";
import Hero from "./components/hero";
import About from "./about/AboutComponent";
import Vegetables from "./components/vegetables";
import CategoryNav from "./components/CategoryNav";
import Testimonials from "./components/Testimonials";
import HowItWorks from "./components/HowItWorks";

export default async function Home() {
  // Fetch dynamic categories and products from the backend (Cloudinary images)
  let sections = [];
  let slides = [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/home/`, {
      next: { revalidate: 60 }
    });
    if (res.ok) {
      const data = await res.json();
      sections = data.categories || [];
      slides = data.slides || [];
    }
  } catch (error) {
    console.error("Failed to fetch dynamic home data:", error);
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] font-sans">
      {/* Header */}
      <Navbar />

      {/* Hero Section - slides passed from server to avoid client-side fetch delay */}
      <Hero slides={slides} />

      {/* Dynamic Category Section (Restored Cloudinary Images) */}
      <CategoryNav initialCategories={sections} />

      {/* Dynamic Products Section (Restored Cloudinary Images) */}
      <Vegetables initialSections={sections} />

      <About />

      {/* Testimonials */}
      {/* <Testimonials /> */}

      {/* How it Works Section */}
      <HowItWorks />

      {/* Assistance Banner */}
      <section className="px-4 sm:px-8 md:px-16 mt-10 pb-20 max-w-7xl mx-auto">
        <div className="relative rounded-3xl bg-white shadow-lg border border-gray-100 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#216140] via-[#2e8b57] to-[#216140]" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#216140]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#216140]/5 rounded-full blur-3xl" />
          <div className="relative px-6 py-12 md:py-16 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#216140]/10 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-[#216140]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4 tracking-tight">Need Personalized Assistance?</h2>
            <p className="text-gray-500 text-xs md:text-sm lg:text-base max-w-2xl mb-6 md:mb-8 leading-relaxed">
              Chat with our personal shoppers directly on WhatsApp. We can help you customize your box or find specific seasonal items just for you.
            </p>
            <a
              href="https://wa.me/919461877701?text=hi"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#216140] hover:bg-[#1a4d32] text-white font-bold text-sm md:text-base py-2.5 md:py-3 px-6 md:px-8 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.125-.345-.156-.841-.334-1.637-.704-1.144-.531-1.895-1.579-1.953-1.656-.058-.078-.466-.622-.466-1.189 0-.568.293-.847.399-.961.106-.114.23-.142.307-.142.076 0 .152.001.218.004.067.003.155-.027.243.187.089.214.305.748.332.812.028.064.046.139.009.214-.037.075-.056.12-.112.182-.056.062-.119.136-.168.188-.053.056-.11.115-.046.225.064.11.286.471.611.762.421.378.775.494.887.549.112.056.177.047.243-.028.067-.075.289-.333.366-.447.078-.115.155-.096.255-.058.099.038.629.297.737.35.108.053.181.08.207.123.026.043.026.248-.118.653z" /></svg>
              Contact us on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
