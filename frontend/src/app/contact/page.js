import ContactComponent from "./ContactComponent";

export const metadata = {
  title: "Contact Us | Freshinbasket",
  description: "Get in touch with Freshinbasket. Call or WhatsApp us at +91-94618-77701 or email support@freshinbasket.com for order help, queries, or feedback.",
  openGraph: {
    title: "Contact Freshinbasket — Fresh Grocery Delivery Support",
    description: "Get in touch with Freshinbasket. Call, WhatsApp, or email us for any help with your orders.",
    url: "https://www.freshinbasket.com/contact",
  },
  alternates: {
    canonical: "https://www.freshinbasket.com/contact",
  },
};

export default function ContactPage() {
  return <ContactComponent />;
}
