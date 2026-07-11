"use client";
import Navbar from "../components/Navbar";
import Link from "next/link";
import { ArrowLeft, UserX } from "lucide-react";

export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-12 flex-grow w-full">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <UserX size={20} className="text-red-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Deletion</h1>
              <p className="text-gray-500 text-sm mt-1">How to delete your Freshinbasket account</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-8 text-gray-600">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Deleting Your Account</h2>
            <p className="text-sm leading-relaxed mb-3">
              If you wish to delete your Freshinbasket account and remove your personal data from our systems, you can do so by following the instructions below.
            </p>
            <p className="text-sm leading-relaxed mb-3">
              Please note that deleting your account is a permanent action. Once your account is deleted, you will lose access to your order history, saved addresses, and any active subscriptions or benefits.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How to Request Account Deletion</h2>
            <p className="text-sm leading-relaxed mb-2">You have two options to delete your account:</p>
            
            <h3 className="text-md font-semibold text-gray-800 mt-4 mb-2">Option 1: Delete via the App or Website (Recommended)</h3>
            <ol className="list-decimal pl-5 text-sm space-y-1 mb-4">
              <li>Log in to your Freshinbasket account.</li>
              <li>Navigate to your <strong>Profile</strong> or <strong>Account Settings</strong>.</li>
              <li>Look for the <strong>Delete Account</strong> option at the bottom of the page.</li>
              <li>Follow the on-screen prompts to confirm the deletion of your account.</li>
            </ol>

            <h3 className="text-md font-semibold text-gray-800 mt-4 mb-2">Option 2: Contact Customer Support</h3>
            <p className="text-sm leading-relaxed mb-2">
              If you are unable to access your account or prefer to have us handle the deletion, you can request account deletion by contacting our support team.
            </p>
            <ol className="list-decimal pl-5 text-sm space-y-1 mb-3">
              <li>Send an email to <a href="mailto:support@freshinbasket.com" className="text-green-700 hover:underline">support@freshinbasket.com</a> from the email address associated with your Freshinbasket account.</li>
              <li>Use the subject line: <strong>"Account Deletion Request"</strong>.</li>
              <li>Include your full name and registered phone number in the body of the email.</li>
            </ol>
            <p className="text-sm leading-relaxed">
              Our support team will process your request and confirm once your account has been successfully deleted. This process may take up to 7 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Retention</h2>
            <p className="text-sm leading-relaxed mb-3">
              Upon account deletion, we will remove your personal data from our active databases. However, we may retain certain information as required by law, for legitimate business purposes (such as fraud prevention or resolving disputes), or for tax and accounting purposes.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
              <p className="font-semibold text-gray-900 mb-2">Need Help?</p>
              <ul className="space-y-2">
                <li><span className="font-medium text-gray-700">Email:</span> <a href="mailto:support@freshinbasket.com" className="text-green-700 hover:underline">support@freshinbasket.com</a></li>
                <li><span className="font-medium text-gray-700">Phone:</span> +91-9461877701</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
