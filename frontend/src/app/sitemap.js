export default async function sitemap() {
  // Use environment variable or default to your domain
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.freshinbasket.com';

  const routes = [
    { route: '',           changeFrequency: 'daily',   priority: 1.0 },
    { route: '/about',     changeFrequency: 'monthly',  priority: 0.7 },
    { route: '/contact',   changeFrequency: 'monthly',  priority: 0.7 },
    { route: '/privacy',   changeFrequency: 'yearly',   priority: 0.4 },
    { route: '/terms',     changeFrequency: 'yearly',   priority: 0.4 },
    { route: '/refund-policy',   changeFrequency: 'yearly',  priority: 0.4 },
    { route: '/delete-account',  changeFrequency: 'yearly',  priority: 0.3 },
  ].map(({ route, changeFrequency, priority }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency,
    priority,
  }));

  // Add categories dynamically
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/`, {
      next: { revalidate: 3600 }
    });
    if (res.ok) {
      const data = await res.json();
      const categories = data.results || data;
      categories.forEach(category => {
        routes.push({
          url: `${baseUrl}/category/${category.slug || category.id}`,
          lastModified: new Date().toISOString(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      });
    }
  } catch (error) {
    console.error("Sitemap category fetch error", error);
  }

  // Add products dynamically
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/`, {
      next: { revalidate: 3600 }
    });
    if (res.ok) {
      const data = await res.json();
      const products = data.results || data;
      products.forEach(product => {
        routes.push({
          url: `${baseUrl}/product/${product.id}`,
          lastModified: new Date().toISOString(),
          changeFrequency: 'daily',
          priority: 0.9,
        });
      });
    }
  } catch (error) {
    console.error("Sitemap product fetch error", error);
  }

  return routes;
}
