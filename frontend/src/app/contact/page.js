"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Send, Loader2, MessageSquare } from "lucide-react";
import { getUser, getAccessToken } from "@/lib/auth";

export default function ContactPage() {
  const [mounted, setMounted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  useEffect(() => {
    const user = getUser();
    if (user) {
      setForm({ name: user.username || "", email: user.email || "", message: "" });
    }
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const token = getAccessToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch {
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
            <p className="text-gray-500 text-sm mt-1">We'd love to hear from you. Get in touch with our team.</p>
          </div>
          <Link
            href="/my-queries"
            className="flex items-center gap-2 px-5 py-2.5 border border-green-300 rounded-xl text-sm font-medium text-green-700 hover:bg-green-50 transition-colors shrink-0"
          >
            <MessageSquare size={16} /> My Queries
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Phone size={18} className="text-green-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Phone</h3>
                <p className="text-sm text-gray-500">+91 94618-77701</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Mail size={18} className="text-green-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Email</h3>
                <p className="text-sm text-gray-500">support@freshinbasket.com</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-green-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Address</h3>
                <p className="text-sm text-gray-500">123 Green Lane, Organic Valley, Coimbatore - 641001</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            {!mounted ? (
              <div className="py-10" />
            ) : !getUser() ? (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">Please log in to send a message.</p>
                <Link
                  href="/login"
                  className="inline-block bg-green-800 text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-green-900 transition-colors"
                >
                  Log In
                </Link>
              </div>
            ) : submitted ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={24} className="text-green-700" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-1">Thank You!</h3>
                <p className="text-sm text-gray-500 mb-4">Your message has been received. We'll get back to you shortly.</p>
                <Link
                  href="/my-queries"
                  className="inline-block text-green-700 text-sm font-medium hover:underline"
                >
                  View your queries
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Your Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-700"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-700"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-700 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-green-800 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-900 transition-colors disabled:opacity-50"
                >
                  {sending ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
