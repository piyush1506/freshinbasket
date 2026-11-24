import Link from "next/link";
import Navbar from "../components/Navbar";
import { SITE_URL } from "@/data/blogs";
import { TrendingUp, ShoppingBag, MapPin, Clock, ArrowRight } from "lucide-react";

export const revalidate = 3600;

export const metadata = {
  title: "Bhilwara Mandi Bhav Today (Aaj Ka Mandi Bhav) — Fruits & Sabzi Rates",
  description:
    "Check aajka mandi bhav and today's Bhilwara mandi fresh fruit & vegetable rates. Order farm-fresh produce online across Bhilwara on Freshinbasket.",
  keywords: [
    "aajka mandi bhav",
    "aaj ka mandi bhav",
    "bhilwara mandi",
    "bhilwara mandi bhav",
    "bhilwara aaj ki mandi ka bhav",
    "bhilwara sabzi mandi rate today",
    "fruits in bhilwara",
    "fresh fruits near me",
    "freshinbasket",
  ],
  alternates: {
    canonical: `${SITE_URL}/bhilwara-mandi-bhav`,
  },
  openGraph: {
    title: "Aaj Ka Bhilwara Mandi Bhav | Freshinbasket Live Rates",
    description:
      "Today's Bhilwara Mandi vegetable and fruit price guide with doorstep delivery in Bhilwara.",
    type: "website",
    url: `${SITE_URL}/bhilwara-mandi-bhav`,
  },
};

async function getLiveProducts() {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return [];
  const base = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;

  try {
    const res = await fetch(`${base}/api/v1/products/`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.results || [];
    return list.filter((p) => p.is_active !== false).slice(0, 30);
  } catch {
    return [];
  }
}

export default async function BhilwaraMandiBhavPage() {
  const products = await getLiveProducts();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Bhilwara Mandi Bhav",
        item: `${SITE_URL}/bhilwara-mandi-bhav`,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Aaj Ka Bhilwara Mandi Bhav?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Aaj Ka Bhilwara Mandi Bhav refers to the daily morning wholesale and retail price trends of fresh vegetables and fruits in Bhilwara Krishi Upaj Mandi. Freshinbasket updates live household delivery rates based on daily farm and mandi sourcing.",
        },
      },
      {
        "@type": "Question",
        name: "Can I order fruits and vegetables at fair Bhilwara Mandi rates online?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! On Freshinbasket, you can order fresh fruits and vegetables directly from local farms and morning mandi lots with transparent pricing and doorstep delivery across Bhilwara.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Navbar hideCategories />

      <section className="bg-gradient-to-br from-[#1B3624] via-[#216140] to-[#2e7d52] text-white py-14 sm:py-20 px-4 sm:px-8 md:px-16">
        <div className="max-w-6xl mx-auto">
          <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-green-200 mb-4 flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white font-semibold">Bhilwara Mandi Bhav</span>
          </nav>

          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold mb-4">
            <TrendingUp className="w-3.5 h-3.5" />
            Aaj Ka Mandi Bhav • Bhilwara, Rajasthan
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Bhilwara Mandi — Aaj Ka Mandi Bhav &amp; Daily Fresh Rates
          </h1>
          <p className="text-green-100 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
            Check <strong>aaj ka mandi bhav</strong> and live <strong>Bhilwara mandi</strong> fruit &amp;
            vegetable rates with doorstep delivery across Bhilwara.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs sm:text-sm text-green-100">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-green-300" /> Bhilwara, Rajasthan (311001)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-green-300" /> Delivery 7:00 AM – 9:00 PM Daily
            </span>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 md:px-16 py-12 space-y-12">
        {/* Live Product Rate Table */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Today&apos;s Fresh Produce Rates in Bhilwara
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Live Freshinbasket store rates sourced fresh from Bhilwara farms and mandi lots.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#216140] hover:bg-[#194b31] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors w-max"
            >
              <ShoppingBag className="w-4 h-4" />
              Order Online Now
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-600">
                      <th className="py-3.5 px-4 font-bold">Item Name</th>
                      <th className="py-3.5 px-4 font-bold">Unit</th>
                      <th className="py-3.5 px-4 font-bold">Freshinbasket Price</th>
                      <th className="py-3.5 px-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-green-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          <Link
                            href={`/product/${product.id}`}
                            className="hover:text-[#216140] hover:underline"
                          >
                            {product.name}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {product.unit?.name || "Per unit"}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#216140]">
                          ₹{product.price}
                          {product.mrp && Number(product.mrp) > Number(product.price) && (
                            <span className="ml-2 text-xs text-gray-400 line-through font-normal">
                              ₹{product.mrp}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/product/${product.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#216140] hover:underline"
                          >
                            Buy Fresh <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-gray-700 font-medium mb-4">
                Browse today&apos;s live vegetable and fruit rates directly in our Bhilwara store.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-[#216140] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#194b31]"
              >
                Open Live Store Rates
              </Link>
            </div>
          )}
        </section>

        {/* Guide Summary */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              About Bhilwara Krishi Upaj Mandi &amp; Daily Rates
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Bhilwara Mandi sets the benchmark for daily produce rates across Bhilwara district.
              Morning arrivals of potatoes, onions, tomatoes, seasonal sabzi, and fresh fruits in
              Bhilwara determine daily mandi bhav.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              With Freshinbasket, you don&apos;t have to travel to the mandi early morning—we hand-pick
              farm-fresh produce and deliver across Bhilwara with transparent daily pricing.
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Read Our Bhilwara Produce Blogs
            </h2>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/blog/aaj-ka-bhilwara-mandi-bhav-guide"
                  className="font-semibold text-[#216140] hover:underline flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4 shrink-0" />
                  Aaj Ka Bhilwara Mandi Bhav &amp; Fresh Produce Price Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/blog/fresh-fruits-near-me-in-bhilwara"
                  className="font-semibold text-[#216140] hover:underline flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4 shrink-0" />
                  Fresh Fruits Near Me in Bhilwara: Farm-Fresh Delivery Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/blog/seasonal-fruits-and-vegetables-bhilwara-guide"
                  className="font-semibold text-[#216140] hover:underline flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4 shrink-0" />
                  Seasonal Fruits &amp; Vegetables Calendar for Bhilwara
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
