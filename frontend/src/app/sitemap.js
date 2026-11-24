import { BLOG_POSTS } from "@/data/blogs";

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.freshinbasket.com";

  // Use INTERNAL_API_URL when available (server-side only, not exposed to browser).
  // Falls back to NEXT_PUBLIC_API_URL which works in local dev.
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const now = new Date().toISOString();

  // ── Static pages ──────────────────────────────────────────────
  // Only include indexable public pages.
  // /search, /login, /cart, /profile, /order, /wishlist are excluded (noindex / private)
  const staticRoutes = [
    { route: "", changeFrequency: "daily", priority: 1.0 },
    { route: "/blog", changeFrequency: "weekly", priority: 0.85 },
    { route: "/about", changeFrequency: "monthly", priority: 0.75 },
    { route: "/contact", changeFrequency: "monthly", priority: 0.75 },
    { route: "/privacy", changeFrequency: "yearly", priority: 0.4 },
    { route: "/terms", changeFrequency: "yearly", priority: 0.4 },
    { route: "/refund-policy", changeFrequency: "yearly", priority: 0.4 },
  ].map(({ route, changeFrequency, priority }) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  // ── Blog posts ────────────────────────────────────────────────
  const blogRoutes = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.publishedAt).toISOString(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // ── Helper: fetch all items (handles paginated and plain-array responses) ──
  async function fetchAll(endpoint) {
    const items = [];
    let url = `${apiUrl}${endpoint}`;

    try {
      while (url) {
        const res = await fetch(url, {
          next: { revalidate: 3600 },
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          console.error(`Sitemap fetch failed: ${url} → ${res.status}`);
          break;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          items.push(...data);
          break;
        } else if (data.results) {
          items.push(...data.results);
          url = data.next || null; // follow DRF pagination
        } else {
          break;
        }
      }
    } catch (error) {
      console.error(`Sitemap fetch error for ${endpoint}:`, error.message);
    }

    return items;
  }

  // ── Dynamic: Categories ───────────────────────────────────────
  const categories = await fetchAll("/api/v1/categories/");
  const categoryRoutes = categories
    .filter((c) => c.slug)
    .map((category) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  // ── Dynamic: Products ─────────────────────────────────────────
  const products = await fetchAll("/api/v1/products/");
  const productRoutes = products
    .filter((p) => p.is_active !== false && p.id)
    .map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: product.updated_at ? new Date(product.updated_at).toISOString() : now,
      changeFrequency: "daily",
      priority: 0.9,
    }));

  console.log(
    `[Sitemap] ${staticRoutes.length} static + ${blogRoutes.length} blogs + ${categoryRoutes.length} categories + ${productRoutes.length} products = ${
      staticRoutes.length + blogRoutes.length + categoryRoutes.length + productRoutes.length
    } total URLs`
  );

  return [...staticRoutes, ...blogRoutes, ...categoryRoutes, ...productRoutes];
}
