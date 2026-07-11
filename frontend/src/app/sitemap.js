export default async function sitemap() {
  // Use environment variable or default to your domain
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.freshinbasket.com';

  const routes = [
    '',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/search',
    '/login'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  // Add categories dynamically
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/`);
    if (res.ok) {
      const data = await res.json();
      const categories = data.results || data;
      categories.forEach(category => {
        routes.push({
          url: `${baseUrl}/category/${category.slug || category.id}`,
          lastModified: new Date().toISOString(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }
  } catch (error) {
    console.error("Sitemap category fetch error", error);
  }

  // Add products dynamically
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/`);
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
