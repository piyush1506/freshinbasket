import ProductDetailClient from "./ProductDetailClient";

async function getProductAndRelated(id) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${apiUrl}/api/v1/products/${id}/`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    const product = await res.json();

    const allRes = await fetch(`${apiUrl}/api/v1/products/`, {
      next: { revalidate: 60 }
    });
    let related = [];
    if (allRes.ok) {
      const allData = await allRes.json();
      const prodCats = product.category_names || [];
      related = allData.filter(
        (p) => {
          if (Number(p.id) === Number(id)) return false;
          const pCats = p.category_names || [];
          return pCats.some((c) => prodCats.includes(c));
        }
      ).slice(0, 8);
    }

    return { product, related };
  } catch (error) {
    console.error("Error fetching product data on server:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  try {
    const res = await fetch(`${apiUrl}/api/v1/products/${id}/`);
    if (!res.ok) return { title: "Product Not Found | Freshinbasket" };
    const product = await res.json();

    const title = `${product.name} | Freshinbasket`;
    const description = product.description || `Order fresh ${product.name} online at the best price in Bhilwara from Freshinbasket. Organic, farm fresh delivery to your doorstep.`;
    const imageUrl = product.image_url || `${apiUrl}/logo/logo.jpg`;

    return {
      title,
      description,
      keywords: [
        product.name,
        "fresh " + product.name,
        "buy " + product.name,
        "freshinbasket",
        "fresh fruits in bhilwara",
        "vegetables in bhilwara"
      ],
      openGraph: {
        title,
        description,
        type: "website",
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 800,
            alt: product.name,
          }
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      }
    };
  } catch (e) {
    console.error("Failed to generate dynamic product metadata:", e);
    return { title: "Product Details | Freshinbasket" };
  }
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const data = await getProductAndRelated(id);

  if (!data || !data.product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 font-medium">Product not found.</p>
      </div>
    );
  }

  const { product } = data;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image_url || `${apiUrl}/logo/logo.jpg`,
    "description": product.description || `Buy fresh ${product.name} online from Freshinbasket.`,
    "sku": `prod_${product.id}`,
    "offers": {
      "@type": "Offer",
      "url": `https://freshinbasket.com/product/${product.id}`,
      "priceCurrency": "INR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductDetailClient product={data.product} related={data.related} />
    </>
  );
}
