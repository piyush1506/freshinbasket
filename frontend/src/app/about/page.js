import About from "./AboutComponent";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "About Freshinbasket — Farm Fresh Fruits & Sabzi in Bhilwara",
  description:
    "Freshinbasket delivers fresh fruits in Bhilwara and daily vegetables straight from local farms to your doorstep.",
  keywords: [
    "about freshinbasket",
    "freshinbasket bhilwara",
    "fresh fruits near me",
    "fruits in bhilwara",
  ],
  openGraph: {
    title: "About Freshinbasket — Farm Fresh Delivered in Bhilwara",
    description:
      "Learn about Freshinbasket — Bhilwara's trusted farm-fresh vegetables and fruits doorstep delivery service.",
    url: "https://www.freshinbasket.com/about",
  },
  alternates: {
    canonical: "https://www.freshinbasket.com/about",
  },
};

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <About />
    </div>
  );
}
