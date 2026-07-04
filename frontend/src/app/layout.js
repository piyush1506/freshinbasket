import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import CartBottomBar from "./components/CartBottomBar";
import MobileAppBanner from "./components/MobileAppBanner";
import Footer from "./components/Footer";
import PageTransitionWrapper from "./components/PageTransitionWrapper";

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
  description: "Order fresh organic vegetables and fruits delivered to your doorstep. Farm-fresh produce from local farmers.",
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
    "bhilwara aaj ki mandi ka bhav"
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Freshinbasket — Farm Fresh Delivered",
    description: "Order fresh organic vegetables and fruits delivered to your doorstep.",
    type: "website",
    locale: "en_IN",
    siteName: "Freshinbasket",
  },
  icons: {
    icon: "/favicon.ico",
     shortcut: "/favicon.ico",
     apple:"/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#216140",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
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
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(navigationSchema) }}
        />
        <CartProvider>
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
