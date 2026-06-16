"use client";
import { Leaf, Heart, ShieldCheck, Truck } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import About from "./AboutComponent";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <About />

    </div>
  );
}
