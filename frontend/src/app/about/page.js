import About from "./AboutComponent";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "About Us | Freshinbasket",
  description: "Learn about Freshinbasket — Bhilwara's trusted farm-fresh grocery delivery service. We source directly from local farmers and deliver fresh vegetables and fruits to your doorstep.",
  openGraph: {
    title: "About Freshinbasket — Farm Fresh Delivered in Bhilwara",
    description: "Learn about Freshinbasket — Bhilwara's trusted farm-fresh grocery delivery service.",
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
