"use client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsAndConditions() {
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
              <h1 className="text-3xl font-bold text-gray-900">Terms and Conditions</h1>
              <p className="text-gray-500 text-sm mt-1">Last Updated: June 20, 2026</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-8 text-gray-600">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed mb-3">
              Welcome to Freshinbasket ("Company," "we," "our," or "us"). These Terms and Conditions govern your access to and use of the Freshinbasket website, mobile applications, and related services.
            </p>
            <p className="text-sm leading-relaxed">
              By accessing, browsing, registering, or placing an order through Freshinbasket, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these Terms, you must not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. About Freshinbasket</h2>
            <p className="text-sm leading-relaxed mb-2">
              Freshinbasket is an online platform that sources, stores, markets, and delivers fresh fruits, vegetables, and related products to customers.
            </p>
            <p className="text-sm leading-relaxed mb-2">Our services include:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Online ordering of fruits and vegetables</li>
              <li>Home delivery services</li>
              <li>Wholesale and retail sales</li>
              <li>Customer support and order management</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Eligibility</h2>
            <p className="text-sm leading-relaxed mb-2">To use our services, you must:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Be at least 18 years old or have permission from a parent or legal guardian.</li>
              <li>Provide accurate and complete information during registration and checkout.</li>
              <li>Use the platform in compliance with applicable laws.</li>
            </ul>
            <p className="text-sm leading-relaxed">
              We reserve the right to suspend or terminate accounts that provide false information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Account</h2>
            <p className="text-sm leading-relaxed mb-2">When creating an account, you agree to:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Maintain accurate account information.</li>
              <li>Keep your login credentials confidential.</li>
              <li>Accept responsibility for activities conducted through your account.</li>
              <li>Notify us immediately of any unauthorized use of your account.</li>
            </ul>
            <p className="text-sm leading-relaxed">
              Freshinbasket is not responsible for losses resulting from unauthorized access caused by your failure to protect account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Products and Availability</h2>
            <p className="text-sm leading-relaxed mb-2">
              Freshinbasket strives to ensure that product descriptions, images, prices, and availability are accurate. However:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Product images are for illustrative purposes only.</li>
              <li>Actual size, color, weight, and appearance may vary.</li>
              <li>Availability is subject to stock and seasonal conditions.</li>
              <li>We reserve the right to limit quantities purchased.</li>
            </ul>
            <p className="text-sm leading-relaxed">
              We may discontinue products without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Pricing</h2>
            <p className="text-sm leading-relaxed mb-2">
              All prices displayed on the platform are in Indian Rupees (INR) unless otherwise specified. Prices may change without notice due to:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Market conditions</li>
              <li>Supplier pricing changes</li>
              <li>Seasonal availability</li>
              <li>Government taxes or regulations</li>
            </ul>
            <p className="text-sm leading-relaxed">
              The price charged will be the price displayed at the time of order confirmation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Orders</h2>
            <p className="text-sm leading-relaxed mb-2">When an order is placed:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>You will receive an order confirmation.</li>
              <li>Freshinbasket reserves the right to accept or reject any order.</li>
              <li>Orders may be canceled if products become unavailable, payment fails, or fraudulent activity is suspected.</li>
            </ul>
            <p className="text-sm leading-relaxed">
              Order confirmation does not guarantee product availability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Payments</h2>
            <p className="text-sm leading-relaxed mb-2">We offer payment options including:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Online payments through Razorpay</li>
              <li>UPI payments</li>
              <li>Debit cards</li>
              <li>Credit cards</li>
              <li>Net banking</li>
              <li>Cash on Delivery (where available)</li>
            </ul>
            <p className="text-sm leading-relaxed mb-2">
              All online payments are processed by secure third-party payment providers.
            </p>
            <p className="text-sm leading-relaxed">
              Freshinbasket does not store sensitive card information such as CVV numbers or PINs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Delivery</h2>
            <h3 className="text-md font-semibold text-gray-800 mt-4 mb-2">Delivery Areas</h3>
            <p className="text-sm leading-relaxed mb-3">Services are available only in locations where Freshinbasket currently operates.</p>

            <h3 className="text-md font-semibold text-gray-800 mt-4 mb-2">Delivery Times</h3>
            <p className="text-sm leading-relaxed mb-2">Estimated delivery times are provided for convenience only and are not guaranteed. Delivery delays may occur due to:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Weather conditions</li>
              <li>Traffic disruptions</li>
              <li>Operational issues</li>
              <li>Force majeure events</li>
            </ul>

            <h3 className="text-md font-semibold text-gray-800 mt-4 mb-2">Customer Responsibility</h3>
            <p className="text-sm leading-relaxed mb-2">Customers must provide:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Accurate delivery addresses</li>
              <li>Valid contact information</li>
              <li>Reasonable access to delivery locations</li>
            </ul>
            <p className="text-sm leading-relaxed">
              Additional charges may apply for failed delivery attempts caused by incorrect information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Order Cancellation</h2>
            <p className="text-sm leading-relaxed mb-2">Customers may cancel orders before dispatch. Once an order has been dispatched or is out for delivery, cancellation may not be possible.</p>
            <p className="text-sm leading-relaxed mb-2">Freshinbasket reserves the right to cancel orders due to:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Product unavailability</li>
              <li>Pricing errors</li>
              <li>Suspected fraud</li>
              <li>Operational constraints</li>
            </ul>
            <p className="text-sm leading-relaxed">
              Any eligible refunds will be processed according to our Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Returns and Refunds</h2>
            <p className="text-sm leading-relaxed mb-2">Due to the perishable nature of fruits and vegetables:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Returns may not be accepted after delivery.</li>
              <li>Customers should inspect products upon receipt.</li>
              <li>Quality-related complaints must be reported within 24 hours of delivery.</li>
            </ul>
            <p className="text-sm leading-relaxed">
              Refunds, replacements, or credits may be provided at our discretion after reviewing the complaint.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Customer Conduct</h2>
            <p className="text-sm leading-relaxed mb-2">Users agree not to:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Violate applicable laws.</li>
              <li>Submit false information.</li>
              <li>Interfere with platform operations.</li>
              <li>Attempt unauthorized access to systems.</li>
              <li>Upload harmful software or malicious code.</li>
              <li>Abuse customer support staff or delivery personnel.</li>
            </ul>
            <p className="text-sm leading-relaxed">
              Violation of these terms may result in account suspension or termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Intellectual Property</h2>
            <p className="text-sm leading-relaxed mb-2">All content on Freshinbasket, including:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Logos</li>
              <li>Trademarks</li>
              <li>Product listings</li>
              <li>Images</li>
              <li>Designs</li>
              <li>Software</li>
              <li>Text</li>
            </ul>
            <p className="text-sm leading-relaxed mb-2">
              is owned by or licensed to Freshinbasket and is protected by intellectual property laws.
            </p>
            <p className="text-sm leading-relaxed">
              No content may be copied, reproduced, distributed, or modified without prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Limitation of Liability</h2>
            <p className="text-sm leading-relaxed mb-2">To the maximum extent permitted by law, Freshinbasket shall not be liable for:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Indirect damages</li>
              <li>Consequential damages</li>
              <li>Loss of profits</li>
              <li>Business interruption</li>
              <li>Data loss</li>
              <li>Delivery delays beyond reasonable control</li>
            </ul>
            <p className="text-sm leading-relaxed">
              Our total liability shall not exceed the amount paid by the customer for the relevant order.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Disclaimer</h2>
            <p className="text-sm leading-relaxed mb-2">Freshinbasket provides services on an "as available" and "as is" basis. We do not guarantee:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Uninterrupted service</li>
              <li>Error-free operation</li>
              <li>Continuous product availability</li>
              <li>Complete accuracy of all content</li>
            </ul>
            <p className="text-sm leading-relaxed">
              Users access and use the platform at their own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">16. Third-Party Services</h2>
            <p className="text-sm leading-relaxed mb-2">Our platform may integrate with third-party services including:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Razorpay</li>
              <li>Cloudinary</li>
              <li>Mapping providers</li>
              <li>Analytics providers</li>
            </ul>
            <p className="text-sm leading-relaxed">
              Freshinbasket is not responsible for the content, policies, or practices of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">17. Privacy</h2>
            <p className="text-sm leading-relaxed">
              Your use of Freshinbasket is also governed by our <Link href="/privacy" className="text-green-700 hover:underline">Privacy Policy</Link>, which explains how personal information is collected, used, and protected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">18. Force Majeure</h2>
            <p className="text-sm leading-relaxed mb-2">Freshinbasket shall not be liable for delays or failures resulting from events beyond reasonable control, including:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Natural disasters</li>
              <li>Floods</li>
              <li>Fires</li>
              <li>Government actions</li>
              <li>Internet outages</li>
              <li>Labor disputes</li>
              <li>Transportation disruptions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">19. Termination</h2>
            <p className="text-sm leading-relaxed mb-2">We reserve the right to suspend or terminate access to our services without notice if:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>These Terms are violated.</li>
              <li>Fraudulent activity is detected.</li>
              <li>Required by law.</li>
            </ul>
            <p className="text-sm leading-relaxed">
              Termination does not affect obligations incurred before termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">20. Governing Law</h2>
            <p className="text-sm leading-relaxed mb-2">
              These Terms and Conditions shall be governed by and interpreted in accordance with the laws of India.
            </p>
            <p className="text-sm leading-relaxed">
              Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts located in the district where Freshinbasket's registered office is situated.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">21. Changes to Terms</h2>
            <p className="text-sm leading-relaxed mb-2">
              Freshinbasket may update these Terms and Conditions at any time. Updated versions will be posted on the platform with a revised "Last Updated" date.
            </p>
            <p className="text-sm leading-relaxed">
              Continued use of the platform constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">22. Contact Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
              <p className="font-semibold text-gray-900 mb-2">Freshinbasket</p>
              <ul className="space-y-2">
                <li><span className="font-medium text-gray-700">Email:</span> <a href="mailto:support@freshinbasket.com" className="text-green-700 hover:underline">support@freshinbasket.com</a></li>
                <li><span className="font-medium text-gray-700">Website:</span> <a href="https://www.freshinbasket.com" className="text-green-700 hover:underline">https://www.freshinbasket.com</a></li>
                <li><span className="font-medium text-gray-700">Phone:</span> +91-9461877701</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">23. Acceptance</h2>
            <p className="text-sm leading-relaxed">
              By accessing, registering, placing orders, or using Freshinbasket services, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
