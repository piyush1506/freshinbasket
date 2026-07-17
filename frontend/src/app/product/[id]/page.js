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

    const title = `Buy Fresh ${product.name} Online in Bhilwara | Freshinbasket`;
    const description = product.description
      || `Order fresh ${product.name} online at the best price in Bhilwara. Farm-fresh ${product.name} delivered to your doorstep from Freshinbasket. Daily harvest, no preservatives.`;
    const imageUrl = product.image_url || `https://www.freshinbasket.com/logo/logo.jpg`;
    const unitLabel = product.unit?.name || "";

    return {
      title,
      description,
      keywords: [
        product.name,
        `fresh ${product.name}`,
        `buy ${product.name} online`,
        `${product.name} in bhilwara`,
        `${product.name} price bhilwara`,
        `${product.name} delivery bhilwara`,
        unitLabel ? `${product.name} ${unitLabel}` : null,
        "freshinbasket",
        "fresh vegetables bhilwara",
        "organic grocery delivery",
      ].filter(Boolean),
      alternates: {
        canonical: `https://www.freshinbasket.com/product/${id}`,
      },
      openGraph: {
        title,
        description,
        type: "website",
        url: `https://www.freshinbasket.com/product/${id}`,
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 800,
            alt: `Fresh ${product.name} - Freshinbasket`,
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

  // Build absolute image URL
  const imageUrl = product.image_url || `https://www.freshinbasket.com/logo/logo.jpg`;

  // Category info — use first category from the categories array
  const firstCategory = product.categories?.[0];
  const categoryName = firstCategory?.name || product.category_names?.[0] || "Products";
  const categorySlug = firstCategory?.slug || "products";

  // Unit label e.g. "500g", "1kg", "piece"
  const unitLabel = product.unit?.name || "";

  // ── Product Schema (Google rich results eligible) ──────────────────────────
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    // Array of images improves rich result eligibility
    "image": [imageUrl],
    "description": product.description
      || `Buy fresh ${product.name}${unitLabel ? ` (${unitLabel})` : ""} online from Freshinbasket. Farm-fresh delivery in Bhilwara.`,
    "sku": `freshinbasket-${product.id}`,
    "brand": {
      "@type": "Brand",
      "name": "Freshinbasket"
    },
    "category": categoryName,
    "offers": {
      "@type": "Offer",
      "url": `https://www.freshinbasket.com/product/${product.id}`,
      "priceCurrency": "INR",
      "price": product.price,
      // Show MRP as the "high price" if it exists and is higher than sale price
      ...(product.mrp && Number(product.mrp) > Number(product.price) ? {
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": product.price,
          "priceCurrency": "INR",
          "referenceQuantity": {
            "@type": "QuantitativeValue",
            "value": "1",
            "unitText": unitLabel || "unit"
          }
        }
      } : {}),
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Freshinbasket",
        "url": "https://www.freshinbasket.com"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "INR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "IN",
          "addressRegion": "Rajasthan"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          }
        }
      }
    }
  };

  // ── BreadcrumbList Schema ──────────────────────────────────────────────────
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.freshinbasket.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": categoryName,
        "item": `https://www.freshinbasket.com/category/${categorySlug}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": `https://www.freshinbasket.com/product/${product.id}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetailClient product={data.product} related={data.related} />
    </>
  );
}
