"use client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPolicy() {
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
              <ShieldCheck size={20} className="text-green-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-gray-500 text-sm mt-1">Last Updated: June 20, 2026</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-8 text-gray-600">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-sm leading-relaxed mb-3">
              Welcome to Freshinbasket ("we," "our," or "us"). Freshinbasket is an online platform that enables customers to purchase fresh fruits, vegetables, and related products for home delivery.
            </p>
            <p className="text-sm leading-relaxed mb-3">
              This Privacy Policy explains how we collect, use, store, disclose, and protect your personal information when you use our website, mobile applications, and related services.
            </p>
            <p className="text-sm leading-relaxed">
              By using Freshinbasket, you agree to the collection and use of information in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            
            <h3 className="text-md font-semibold text-gray-800 mt-4 mb-2">A. Personal Information</h3>
            <p className="text-sm leading-relaxed mb-2">When you create an account, place an order, contact us, or use our services, we may collect:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-4">
              <li>Full name</li>
              <li>Email address</li>
              <li>Mobile phone number</li>
              <li>Delivery address</li>
              <li>Billing address</li>
              <li>Profile information</li>
              <li>Account credentials</li>
            </ul>

            <h3 className="text-md font-semibold text-gray-800 mt-4 mb-2">B. Order Information</h3>
            <p className="text-sm leading-relaxed mb-2">When you place an order, we may collect:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-4">
              <li>Products purchased</li>
              <li>Quantity ordered</li>
              <li>Order history</li>
              <li>Payment status</li>
              <li>Delivery details</li>
            </ul>

            <h3 className="text-md font-semibold text-gray-800 mt-4 mb-2">C. Payment Information</h3>
            <p className="text-sm leading-relaxed mb-2">Payments are processed through trusted third-party payment providers such as Razorpay.</p>
            <p className="text-sm leading-relaxed mb-2">We do not store your complete credit card, debit card, UPI PIN, CVV, net banking credentials, or other sensitive payment information on our servers.</p>
            <p className="text-sm leading-relaxed mb-4">Payment processors may collect payment-related information in accordance with their own privacy policies.</p>

            <h3 className="text-md font-semibold text-gray-800 mt-4 mb-2">D. Device and Technical Information</h3>
            <p className="text-sm leading-relaxed mb-2">We may automatically collect:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-4">
              <li>IP address</li>
              <li>Browser type</li>
              <li>Device type</li>
              <li>Operating system</li>
              <li>Date and time of access</li>
              <li>Pages visited</li>
              <li>Usage data</li>
            </ul>

            <h3 className="text-md font-semibold text-gray-800 mt-4 mb-2">E. Location Information</h3>
            <p className="text-sm leading-relaxed mb-2">For delivery services and delivery partners, we may collect location information:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-2">
              <li>Delivery address provided by customers</li>
              <li>Real-time location of delivery personnel (when applicable)</li>
              <li>GPS data used for order tracking and delivery management</li>
            </ul>
            <p className="text-sm leading-relaxed mb-4">Location information is collected only when necessary for providing delivery-related services.</p>

            <h3 className="text-md font-semibold text-gray-800 mt-4 mb-2">F. Communications</h3>
            <p className="text-sm leading-relaxed mb-2">We may collect information when you:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-4">
              <li>Contact customer support</li>
              <li>Submit inquiries</li>
              <li>Send feedback</li>
              <li>Participate in surveys or promotions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p className="text-sm leading-relaxed mb-2">We use your information to:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Create and manage user accounts</li>
              <li>Process and deliver orders</li>
              <li>Verify transactions</li>
              <li>Provide customer support</li>
              <li>Improve our services</li>
              <li>Send order confirmations and delivery updates</li>
              <li>Detect fraud and security threats</li>
              <li>Comply with legal obligations</li>
              <li>Analyze platform performance and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Cookies and Tracking Technologies</h2>
            <p className="text-sm leading-relaxed mb-2">Freshinbasket may use cookies and similar technologies to:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Maintain user sessions</li>
              <li>Remember preferences</li>
              <li>Improve website performance</li>
              <li>Analyze traffic and usage patterns</li>
            </ul>
            <p className="text-sm leading-relaxed">
              You may configure your browser to reject cookies; however, some features may not function properly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Sharing of Information</h2>
            <p className="text-sm leading-relaxed mb-3">We may share information with:</p>

            <h3 className="text-md font-semibold text-gray-800 mt-4 mb-2">Service Providers</h3>
            <p className="text-sm leading-relaxed mb-2">Third-party vendors that assist with:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-4">
              <li>Payment processing</li>
              <li>Cloud hosting</li>
              <li>Delivery operations</li>
              <li>Analytics services</li>
              <li>Customer support services</li>
            </ul>

            <h3 className="text-md font-semibold text-gray-800 mt-4 mb-2">Delivery Personnel</h3>
            <p className="text-sm leading-relaxed mb-2">Information necessary for fulfilling and delivering orders, including:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-4">
              <li>Customer name</li>
              <li>Contact number</li>
              <li>Delivery address</li>
            </ul>

            <h3 className="text-md font-semibold text-gray-800 mt-4 mb-2">Legal Authorities</h3>
            <p className="text-sm leading-relaxed mb-2">We may disclose information if required by:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-4">
              <li>Applicable laws</li>
              <li>Court orders</li>
              <li>Government authorities</li>
              <li>Law enforcement agencies</li>
            </ul>

            <h3 className="text-md font-semibold text-gray-800 mt-4 mb-2">Business Transfers</h3>
            <p className="text-sm leading-relaxed mb-4">
              In the event of a merger, acquisition, restructuring, or sale of assets, user information may be transferred as part of the transaction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Security</h2>
            <p className="text-sm leading-relaxed mb-2">We implement reasonable technical and organizational safeguards to protect personal information, including:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Secure HTTPS connections</li>
              <li>Authentication and authorization controls</li>
              <li>Password encryption and hashing</li>
              <li>Access controls</li>
              <li>Security monitoring</li>
            </ul>
            <p className="text-sm leading-relaxed">
              However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
            <p className="text-sm leading-relaxed mb-2">We retain personal information only for as long as necessary to:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Provide services</li>
              <li>Complete transactions</li>
              <li>Resolve disputes</li>
              <li>Meet legal and regulatory requirements</li>
            </ul>
            <p className="text-sm leading-relaxed">
              When information is no longer required, it may be securely deleted or anonymized.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
            <p className="text-sm leading-relaxed mb-2">Depending on applicable laws, you may have the right to:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Update account details</li>
              <li>Request deletion of personal information</li>
              <li>Withdraw consent where applicable</li>
              <li>Request information about how your data is processed</li>
            </ul>
            <p className="text-sm leading-relaxed">
              To exercise these rights, contact us using the details below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Children's Privacy</h2>
            <p className="text-sm leading-relaxed mb-2">
              Freshinbasket is not directed toward children under the age of 13 years.
            </p>
            <p className="text-sm leading-relaxed">
              We do not knowingly collect personal information from children. If we become aware that such information has been collected, we will take reasonable steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Third-Party Services</h2>
            <p className="text-sm leading-relaxed mb-2">Our platform may integrate with third-party services including:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
              <li>Razorpay</li>
              <li>Cloudinary</li>
              <li>Analytics providers</li>
              <li>Mapping and location service providers</li>
            </ul>
            <p className="text-sm leading-relaxed">
              These third parties operate under their own privacy policies, and we encourage users to review them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. International Data Transfers</h2>
            <p className="text-sm leading-relaxed mb-2">
              Your information may be processed and stored on servers located in different jurisdictions where our service providers operate.
            </p>
            <p className="text-sm leading-relaxed">
              We take reasonable measures to ensure appropriate protection of personal information during such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to This Privacy Policy</h2>
            <p className="text-sm leading-relaxed mb-2">
              We may update this Privacy Policy periodically.
            </p>
            <p className="text-sm leading-relaxed">
              Any changes will be posted on this page with an updated "Last Updated" date. Continued use of the services after changes become effective constitutes acceptance of the revised Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact Us</h2>
            <p className="text-sm leading-relaxed mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy, please contact:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
              <p className="font-semibold text-gray-900 mb-2">Freshinbasket</p>
              <ul className="space-y-2">
                <li><span className="font-medium text-gray-700">Email:</span> <a href="mailto:support@freshinbasket.com" className="text-green-700 hover:underline">support@freshinbasket.com</a></li>
                <li><span className="font-medium text-gray-700">Website:</span> <a href="https://www.freshinbasket.com" className="text-green-700 hover:underline">https://www.freshinbasket.com</a></li>
                <li><span className="font-medium text-gray-700">Customer Support:</span> +91-9461877701</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Consent</h2>
            <p className="text-sm leading-relaxed">
              By accessing or using Freshinbasket, you acknowledge that you have read, understood, and agreed to this Privacy Policy.
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
