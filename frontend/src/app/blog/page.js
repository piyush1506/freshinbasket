import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/Navbar";
import { BLOG_POSTS, SITE_URL } from "@/data/blogs";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";

export const metadata = {
  title: "Blog — Fresh Fruits in Bhilwara & Produce Guides",
  description:
    "Read Freshinbasket guides on fresh fruits near me, fruits in Bhilwara, and seasonal farm-fresh produce.",
  keywords: [
    "fresh fruits near me",
    "fruits in bhilwara",
    "fresh fruits in bhilwara",
    "freshinbasket blog",
    "fresh vegetables in bhilwara",
  ],
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: "Freshinbasket Blog — Fresh Fruits & Produce Guides",
    description:
      "Helpful guides on fresh fruits near me, buying fruits in Bhilwara, and farm-fresh vegetables.",
    type: "website",
    url: `${SITE_URL}/blog`,
  },
};

export default function BlogIndexPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_URL}/blog`,
      },
    ],
  };

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Freshinbasket Blog",
    description:
      "Local guides on fresh fruits in Bhilwara, fresh fruits near me, and healthy farm-to-door groceries.",
    url: `${SITE_URL}/blog`,
    publisher: {
      "@type": "Organization",
      name: "Freshinbasket",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo/logo.jpg`,
      },
    },
    blogPost: BLOG_POSTS.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt || post.publishedAt,
      image: post.image,
      description: post.metaDescription,
    })),
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

      <Navbar hideCategories />

      {/* Header Banner */}
      <section className="bg-gradient-to-br from-[#1B3624] via-[#216140] to-[#2e7d52] text-white py-14 sm:py-20 px-4 sm:px-8 md:px-16">
        <div className="max-w-6xl mx-auto">
          <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-green-200 mb-4 flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white font-semibold">Blog</span>
          </nav>

          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Freshinbasket Guides &amp; Bhilwara Updates
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Fresh Fruits &amp; Produce Blog
          </h1>
          <p className="text-green-100 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
            Local guides on <strong>fresh fruits near me</strong>,{" "}
            <strong>fruits in Bhilwara</strong>, and farm-fresh seasonal vegetables.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white text-[#1B3624] font-bold text-sm px-5 py-2.5 rounded-full shadow-md hover:bg-green-50 transition-all"
            >
              Shop Fresh Fruits &amp; Vegetables
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Articles Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 md:px-16 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.slug}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
            >
              <Link href={`/blog/${post.slug}`} className="relative h-56 w-full overflow-hidden block">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-[#216140] text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                  {post.category}
                </span>
              </Link>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#216140]" />
                    {post.updatedAt}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#216140]" />
                    {post.readTime}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#216140] transition-colors leading-snug">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>

                <p className="text-gray-600 text-sm leading-relaxed mb-5 flex-1">
                  {post.excerpt}
                </p>

                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#216140] hover:text-[#16422b] transition-colors mt-auto"
                >
                  Read Full Guide
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
