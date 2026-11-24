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
    default: "Freshinbasket — Fresh Fruits Near Me & Vegetables in Bhilwara",
    template: "%s | Freshinbasket",
  },
  description:
    "Freshinbasket delivers fresh fruits near you, fruits in Bhilwara, and farm-fresh organic vegetables directly to your doorstep.",
  keywords: [
    "Freshinbasket",
    "fresh in basket",
    "freshinbasket",
    "freshinbasket bhilwara",
    "fresh fruits near me",
    "fruits in bhilwara",
    "fresh fruits in bhilwara",
    "organic vegetables",
    "fresh fruits",
    "vegetables in bhilwara",
    "online vegetables shop",
    "online fruits shop",
    "grocery delivery bhilwara",
    "sabzi delivery bhilwara",
    "farm delivery",
  ],
  robots: { index: true, follow: true },
  metadataBase: new URL("https://www.freshinbasket.com"),
  alternates: {
    canonical: "https://www.freshinbasket.com",
  },
  openGraph: {
    title: "Freshinbasket — Fresh Fruits Near Me & Vegetables in Bhilwara",
    description:
      "Order fresh fruits in Bhilwara and farm-fresh vegetables with doorstep delivery from local farms.",
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
    title: "Freshinbasket — Fresh Fruits & Vegetables Delivered in Bhilwara",
    description:
      "Freshinbasket delivers fresh fruits near you & daily vegetables in Bhilwara.",
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
    "alternateName": ["Fresh in Basket", "Freshinbasket Bhilwara"],
    "description": "Freshinbasket is Bhilwara's farm-fresh fruits and vegetables delivery store.",
    "url": "https://www.freshinbasket.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.freshinbasket.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    "name": "Freshinbasket",
    "alternateName": "Fresh in Basket",
    "description": "Farm-fresh fruits in Bhilwara and organic vegetables delivered daily to your doorstep.",
    "url": "https://www.freshinbasket.com",
    "telephone": "+919461877701",
    "email": "support@freshinbasket.com",
    "priceRange": "₹",
    "logo": "https://www.freshinbasket.com/logo/logo.jpg",
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
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+919461877701",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": ["en", "hi"]
    },
    "sameAs": [
      "https://www.facebook.com/people/Fresh-in-Basket/61590414913160/",
      "https://www.instagram.com/freshinbasket_/",
      "https://play.google.com/store/apps/details?id=in.freshinbasket.app",
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
        "name": "Fresh Fruits in Bhilwara",
        "description": "Order fresh seasonal fruits near you delivered across Bhilwara.",
        "url": "https://www.freshinbasket.com/category/fruits"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 2,
        "name": "Vegetables in Bhilwara",
        "description": "Buy farm-fresh vegetables and organic sabzi online in Bhilwara.",
        "url": "https://www.freshinbasket.com/category/vegetables"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 3,
        "name": "Freshinbasket Blog",
        "description": "Guides on fresh fruits near me, fruits in Bhilwara, and seasonal nutrition.",
        "url": "https://www.freshinbasket.com/blog"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 4,
        "name": "About Freshinbasket",
        "description": "Brief detail about Freshinbasket, our local Bhilwara farmer network, and doorstep delivery.",
        "url": "https://www.freshinbasket.com/about"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 5,
        "name": "Contact Support",
        "description": "Get customer support via phone, WhatsApp, or email.",
        "url": "https://www.freshinbasket.com/contact"
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
