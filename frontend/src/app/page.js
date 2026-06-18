import Image from "next/image";
import Link from "next/link";
import Footer from './components/Footer';
import Navbar from "./components/Navbar";
import Hero from "./components/hero";
import About from "./about/AboutComponent";
import Vegetables from "./components/vegetables";
import CategoryNav from "./components/CategoryNav";
import Testimonials from "./components/Testimonials";

export default async function Home() {
  // Fetch dynamic categories and products from the backend (Cloudinary images)
  let sections = [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/home/`, {
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    if (res.ok) {
      const data = await res.json();
      sections = data.categories || [];
    }
  } catch (error) {
    console.error("Failed to fetch dynamic home data:", error);
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] font-sans">
      {/* Header */}
      <Navbar />

      {/* Hero Section (Static as requested) */}
      <Hero />

      {/* Dynamic Category Section (Restored Cloudinary Images) */}
      <CategoryNav initialCategories={sections} />

      {/* Dynamic Products Section (Restored Cloudinary Images) */}
      <Vegetables initialSections={sections} />

      <About />

      {/* Testimonials */}
      {/* <Testimonials /> */}

      {/* Assistance Banner */}
      <section className="px-4 sm:px-8 md:px-16 pb-20 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden">
          <Image src="https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&cs=tinysrgb&w=1500" alt="Vegetable market background" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 px-10 py-16 text-center flex flex-col items-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">Need Personalized Assistance?</h2>
            <p className="text-white text-sm md:text-base max-w-2xl mb-8 font-medium drop-shadow-md">
              Chat with our personal shoppers directly on WhatsApp. We can help you customize your box or find specific seasonal items just for you.
            </p>
            <a 
              href="https://wa.me/919461877701?text=hi" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full flex items-center shadow-lg transition-colors"
            >
              <svg className="w-6 h-6 mr-2 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.125-.345-.156-.841-.334-1.637-.704-1.144-.531-1.895-1.579-1.953-1.656-.058-.078-.466-.622-.466-1.189 0-.568.293-.847.399-.961.106-.114.23-.142.307-.142.076 0 .152.001.218.004.067.003.155-.027.243.187.089.214.305.748.332.812.028.064.046.139.009.214-.037.075-.056.12-.112.182-.056.062-.119.136-.168.188-.053.056-.11.115-.046.225.064.11.286.471.611.762.421.378.775.494.887.549.112.056.177.047.243-.028.067-.075.289-.333.366-.447.078-.115.155-.096.255-.058.099.038.629.297.737.35.108.053.181.08.207.123.026.043.026.248-.118.653z" /></svg>
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
