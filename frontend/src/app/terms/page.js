"use client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsAndAgreement() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-12 flex-grow w-full">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <FileText size={20} className="text-green-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Terms and Agreement</h1>
              <p className="text-gray-500 text-sm mt-1">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-8 text-gray-600">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-sm leading-relaxed">
              Welcome to Freshinbasket. These Terms and Agreement govern your use of our website and services. 
              By accessing or using our platform, you agree to be bound by these terms. 
              If you disagree with any part of these terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Our Business Operations</h2>
            <p className="text-sm leading-relaxed">
              Freshinbasket is a wholesale vegetable and fruit seller. We operate under the following business model:
            </p>
            <ul className="list-disc pl-5 mt-2 text-sm space-y-2">
              <li><strong>Sourcing:</strong> We collect fresh vegetables and fruits directly from farmers and other trusted sources.</li>
              <li><strong>Storage:</strong> Our produce is stored in state-of-the-art cold storage facilities to maintain optimal freshness and quality before distribution.</li>
              <li><strong>Ordering:</strong> Customers can place orders directly through our website or mobile application.</li>
              <li><strong>Delivery:</strong> We fulfill customer orders via direct home delivery services, ensuring fresh produce reaches your doorstep.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Orders and Delivery</h2>
            <p className="text-sm leading-relaxed mb-2">
              By placing an order through our website or app, you warrant that you are legally capable of entering into binding contracts.
            </p>
            <ul className="list-disc pl-5 text-sm space-y-2">
              <li>All orders are subject to availability and confirmation of the order price.</li>
              <li>Delivery times may vary according to availability and subject to any delays resulting from postal delays or force majeure for which we will not be responsible.</li>
              <li>We reserve the right to refuse any request made by you.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Pricing and Payment</h2>
            <p className="text-sm leading-relaxed">
              Whilst we try and ensure that all details, descriptions, and prices which appear on this website are accurate, errors may occur. 
              If we discover an error in the price of any goods which you have ordered, we will inform you of this as soon as possible and give you the option of reconfirming your order at the correct price or cancelling it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Contact Us</h2>
            <p className="text-sm leading-relaxed">
              If you have any questions about these Terms and Agreement, please contact us at:
              <br />
              <Link href="/contact" className="text-green-700 hover:underline font-medium inline-block mt-2">
                Visit our Contact Page
              </Link>
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
