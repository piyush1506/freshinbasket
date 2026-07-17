export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.freshinbasket.com';

  // Use INTERNAL_API_URL when available (server-side only, not exposed to browser).
  // Falls back to NEXT_PUBLIC_API_URL which works in local dev.
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const now = new Date().toISOString();

  // ── Static pages ──────────────────────────────────────────────
  // Only include indexable public pages.
  // /search, /login, /cart, /profile, /order, /wishlist are excluded (noindex / private)
  const staticRoutes = [
    { route: '',               changeFrequency: 'daily',   priority: 1.0 },
    { route: '/about',         changeFrequency: 'monthly', priority: 0.7 },
    { route: '/contact',       changeFrequency: 'monthly', priority: 0.7 },
    { route: '/privacy',       changeFrequency: 'yearly',  priority: 0.4 },
    { route: '/terms',         changeFrequency: 'yearly',  priority: 0.4 },
    { route: '/refund-policy', changeFrequency: 'yearly',  priority: 0.4 },
  ].map(({ route, changeFrequency, priority }) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  // ── Helper: fetch all items (handles paginated and plain-array responses) ──
  async function fetchAll(endpoint) {
    const items = [];
    let url = `${apiUrl}${endpoint}`;

    try {
      while (url) {
        const res = await fetch(url, {
          next: { revalidate: 3600 },
          headers: { Accept: 'application/json' },
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
  const categories = await fetchAll('/api/v1/categories/');
  const categoryRoutes = categories
    .filter((c) => c.slug) // only include categories with a slug
    .map((category) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  // ── Dynamic: Products ─────────────────────────────────────────
  const products = await fetchAll('/api/v1/products/');
  const productRoutes = products
    .filter((p) => p.is_active !== false) // exclude inactive products
    .map((product) => ({
      // Use slug-based URL if product has a slug, otherwise fall back to ID
      url: product.slug
        ? `${baseUrl}/product/${product.slug}`
        : `${baseUrl}/product/${product.id}`,
      // Use actual updated_at so Google knows when content changed
      lastModified: product.updated_at ? new Date(product.updated_at).toISOString() : now,
      changeFrequency: 'daily',
      priority: 0.9,
    }));

  console.log(
    `[Sitemap] ${staticRoutes.length} static + ${categoryRoutes.length} categories + ${productRoutes.length} products = ${staticRoutes.length + categoryRoutes.length + productRoutes.length} total URLs`
  );

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
