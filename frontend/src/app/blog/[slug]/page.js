import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Navbar from "../../components/Navbar";
import { BLOG_POSTS, getBlogBySlug, SITE_URL } from "@/data/blogs";
import { Calendar, Clock, CheckCircle2, ArrowLeft, ShoppingBag } from "lucide-react";

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);
  if (!post) {
    return { title: "Article Not Found | Freshinbasket" };
  }

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: {
      canonical: `${SITE_URL}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      url: `${SITE_URL}/blog/${post.slug}`,
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
      images: [post.image],
    },
  };
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = BLOG_POSTS.filter((item) => item.slug !== post.slug).slice(0, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    image: post.image,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Freshinbasket",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo/logo.jpg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE_URL}/blog/${post.slug}`,
      },
    ],
  };

  const faqSchema =
    post.faqs && post.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <Navbar hideCategories />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-[#216140] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#216140] transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold truncate max-w-xs sm:max-w-md">
            {post.title}
          </span>
        </nav>

        <article>
          <span className="inline-block bg-green-100 text-[#216140] text-xs font-bold px-3 py-1 rounded-full mb-4">
            {post.category}
          </span>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-500 mb-8">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#216140]" />
              Updated {post.updatedAt || post.publishedAt}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#216140]" />
              {post.readTime}
            </span>
            <span>By {post.author}</span>
          </div>

          <div className="relative h-64 sm:h-96 w-full rounded-2xl overflow-hidden shadow-md mb-8">
            <Image
              src={post.image}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover"
              priority
            />
          </div>

          {/* Highlights Box */}
          {post.highlights && post.highlights.length > 0 && (
            <div className="bg-green-50/70 border border-green-100 rounded-2xl p-6 mb-8">
              <h2 className="text-base font-bold text-[#1B3624] mb-3">Quick Takeaways</h2>
              <ul className="space-y-2">
                {post.highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-[#216140] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sections */}
          <div className="space-y-8">
            {post.sections.map((section, idx) => (
              <section key={idx} className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {section.heading}
                </h2>
                {section.paragraphs.map((para, pIdx) => (
                  <p key={pIdx} className="text-gray-700 text-base leading-relaxed">
                    {para}
                  </p>
                ))}
                {section.list && (
                  <ul className="space-y-2.5 pl-1 pt-1">
                    {section.list.map((li, lIdx) => (
                      <li key={lIdx} className="flex items-start gap-2.5 text-gray-700 text-base">
                        <span className="w-2 h-2 rounded-full bg-[#216140] shrink-0 mt-2.5" />
                        <span>{li}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* FAQs */}
          {post.faqs && post.faqs.length > 0 && (
            <section className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {post.faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs"
                  >
                    <h3 className="font-bold text-gray-900 text-base mb-2">{faq.question}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* CTA Card */}
        <div className="mt-12 bg-gradient-to-r from-[#1B3624] to-[#216140] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              Order Fresh Fruits &amp; Vegetables in Bhilwara
            </h2>
            <p className="text-green-100 text-sm">
              Daily morning harvest delivered straight to your home with Freshinbasket.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white text-[#1B3624] font-bold text-sm px-5 py-3 rounded-full hover:bg-green-50 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Shop Now
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 bg-white/15 text-white border border-white/25 font-semibold text-sm px-5 py-3 rounded-full hover:bg-white/25 transition-colors"
            >
              About Freshinbasket
            </Link>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-14 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">More from Freshinbasket Blog</h2>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#216140] hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                All Articles
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedPosts.map((item) => (
                <Link
                  key={item.slug}
                  href={`/blog/${item.slug}`}
                  className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow block"
                >
                  <span className="text-[11px] font-bold uppercase text-[#216140]">
                    {item.category}
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm mt-1 mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <span className="text-xs text-gray-500">{item.readTime}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
