import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import CartBottomBar from "./components/CartBottomBar";

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
  keywords: ["organic vegetables", "fresh fruits", "farm delivery", "organic grocery", "Freshinbasket"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Freshinbasket — Farm Fresh Delivered",
    description: "Order fresh organic vegetables and fruits delivered to your doorstep.",
    type: "website",
    locale: "en_IN",
    siteName: "Freshinbasket",
  },
  icons: {
    icon: "/logo/logo.jpg",
  },
};

export const viewport = {
  themeColor: "#216140",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      translate="no"
      suppressHydrationWarning
      className={`${plusJakarta.variable} scroll-smooth h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
        <CartProvider>
          {children}
          <CartBottomBar />
        </CartProvider>
      </body>
    </html>
  );
}
