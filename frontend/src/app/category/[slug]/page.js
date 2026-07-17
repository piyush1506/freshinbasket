import CategoryClient from "./CategoryClient";

// Fetch category name on server for metadata
async function getCategoryInfo(slug) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/api/v1/categories/`, {
      next: { revalidate: 3600 }, // cache for 1 hour
    });
    if (!res.ok) return null;
    const categories = await res.json();
    return categories.find((c) => c.slug?.toLowerCase() === slug?.toLowerCase()) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategoryInfo(slug);

  const categoryName = category?.name || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
  const title = `${categoryName} in Bhilwara | Freshinbasket`;
  const description = `Buy fresh ${categoryName} online in Bhilwara. Farm-fresh ${categoryName} delivered to your doorstep from Freshinbasket. Best prices, daily harvest.`;

  return {
    title,
    description,
    keywords: [
      categoryName,
      `fresh ${categoryName}`,
      `buy ${categoryName} online`,
      `${categoryName} in bhilwara`,
      `${categoryName} delivery bhilwara`,
      "freshinbasket",
      "online grocery bhilwara",
    ],
    alternates: {
      canonical: `https://www.freshinbasket.com/category/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://www.freshinbasket.com/category/${slug}`,
      images: [
        {
          url: category?.image_url || "https://www.freshinbasket.com/logo/logo.jpg",
          width: 800,
          height: 600,
          alt: categoryName,
        },
      ],
    },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = await getCategoryInfo(slug);
  const initialCategoryName = category?.name || null;

  return <CategoryClient initialCategoryName={initialCategoryName} />;
}
