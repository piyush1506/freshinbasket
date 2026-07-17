import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import CartBottomBar from "./components/CartBottomBar";
import MobileAppBanner from "./components/MobileAppBanner";
import Footer from "./components/Footer";
import PageTransitionWrapper from "./components/PageTransitionWrapper";
import GATracker from "./components/GATracker";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "Freshinbasket — Farm Fresh Delivered",
    template: "%s | Freshinbasket",
  },
  description: "Order fresh organic vegetables and fruits delivered to your doorstep in Bhilwara. Farm-fresh produce from local farmers.",
  keywords: [
    "organic vegetables",
    "fresh fruits",
    "farm delivery",
    "online vegetables shop",
    "online fruits shop",
    "organic grocery",
    "Freshinbasket",
    "fresh in basket",
    "freshinbasket",
    "fresh fruits in bhilwara",
    "vegetables in bhilwara",
    "bhilwara aaj ki mandi ka bhav",
    "grocery delivery bhilwara",
    "sabzi delivery bhilwara",
  ],
  robots: { index: true, follow: true },
  metadataBase: new URL("https://www.freshinbasket.com"),
  alternates: {
    canonical: "https://www.freshinbasket.com",
  },
  openGraph: {
    title: "Freshinbasket — Farm Fresh Delivered",
    description: "Order fresh organic vegetables and fruits delivered to your doorstep in Bhilwara.",
    type: "website",
    url: "https://www.freshinbasket.com",
    locale: "en_IN",
    siteName: "Freshinbasket",
    images: [
      {
        url: "https://www.freshinbasket.com/logo/logo.jpg",
        width: 800,
        height: 600,
        alt: "Freshinbasket — Farm Fresh Delivered",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Freshinbasket — Farm Fresh Delivered",
    description: "Order fresh organic vegetables and fruits delivered to your doorstep in Bhilwara.",
    images: ["https://www.freshinbasket.com/logo/logo.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#216140",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Freshinbasket",
    "url": "https://freshinbasket.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://freshinbasket.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    "name": "Freshinbasket",
    "description": "Farm-fresh organic vegetables and fruits delivered to your doorstep in Bhilwara, Rajasthan.",
    "url": "https://www.freshinbasket.com",
    "telephone": "+919461877701",
    "priceRange": "₹",
    "image": "https://www.freshinbasket.com/logo/logo.jpg",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Bhilwara",
      "addressRegion": "Rajasthan",
      "postalCode": "311001",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "25.3462",
      "longitude": "74.6313"
    },
    "areaServed": {
      "@type": "City",
      "name": "Bhilwara"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"
        ],
        "opens": "07:00",
        "closes": "21:00"
      }
    ],
    "sameAs": [
      "https://wa.me/919461877701"
    ]
  };

  const navigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "SiteNavigationElement",
        "position": 1,
        "name": "Vegetables in Bhilwara",
        "url": "https://freshinbasket.com/category/vegetables"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 2,
        "name": "Fresh Fruits in Bhilwara",
        "url": "https://freshinbasket.com/category/fruits"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 3,
        "name": "About Freshinbasket",
        "url": "https://freshinbasket.com/about"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 4,
        "name": "Contact Support",
        "url": "https://freshinbasket.com/contact"
      }
    ]
  };

  return (
    <html
      lang="en"
      translate="no"
      suppressHydrationWarning
      className={`${plusJakarta.variable} scroll-smooth h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Google Analytics — must be in <head> for reliable firing */}
        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(navigationSchema) }}
        />

        <CartProvider>
          {/* GA4 page_view tracker for client-side navigation */}
          {gaId && (
            <Suspense fallback={null}>
              <GATracker gaId={gaId} />
            </Suspense>
          )}
          <main className="flex-grow flex flex-col">
            <PageTransitionWrapper>
              {children}
            </PageTransitionWrapper>
          </main>
          <Footer />
          <MobileAppBanner />
          <CartBottomBar />
        </CartProvider>
      </body>
    </html>
  );
}
