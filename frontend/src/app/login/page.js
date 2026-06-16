"use client";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { AUTH_API, isAuthenticated, getAccessToken } from "@/lib/auth";
import toast from "react-hot-toast";

export default function AuthPage() {
  const { setUser, mergeCart } = useCart();
  const [mode, setMode] = useState("login");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    address: '', phone_number: '',
  });

  useEffect(() => {
    if (isAuthenticated()) router.replace('/');
  }, [router]);

  const handleLogin = async () => {
    setError("");
    if (!form.email || !form.password) return setError("Please fill in all fields.");
    setLoading(true);
    try {
      const data = await AUTH_API.login(form.email, form.password);
      setUser(data.user);
      if (getAccessToken() && mergeCart) await mergeCart(getAccessToken());
      toast.success('Login successful');
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError("");
    if (!form.username || !form.email || !form.password || !form.confirmPassword)
      return setError("Please fill in all fields.");
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match.");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      const data = await AUTH_API.register({
        username: form.username,
        email: form.email,
        password: form.password,
        confirm_password: form.confirmPassword,
        phone_number: form.phone_number || "",
        address: form.address || "",
      });
      setUser(data.user);
      if (getAccessToken() && mergeCart) await mergeCart(getAccessToken());
      toast.success(`Welcome, ${data.user?.username}! Account created.`);
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') handleLogin();
    else handleRegister();
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-[#FAFAFA]">
      <nav className="flex justify-between items-center px-10 py-6 bg-[#FAFAFA]">
        <div className="text-[28px] font-extrabold text-[#1B3624] tracking-tight">Freshinbasket</div>
        <div className="flex gap-8 items-center">
          <div className="flex flex-col items-center">
            <button className="text-gray-800 hover:text-black">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </button>
            <div className="w-5 h-[2px] bg-[#1B3624] mt-1.5 rounded-full"></div>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col md:flex-row">
        <div className="hidden md:block w-full md:w-1/2 relative min-h-[500px] md:min-h-[calc(100vh-200px)] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1200&auto=format&fit=crop"
            alt="Organic Vegetables"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          <div className="absolute bottom-16 left-12 right-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[24px] p-10 text-white shadow-2xl">
            <h2 className="text-[44px] md:text-[52px] font-bold mb-4 leading-tight">Straight from<br />the Soil</h2>
            <p className="text-[17px] font-medium text-white/90 leading-relaxed max-w-sm">
              Experience the true taste of nature with our hand-picked organic harvests, delivered with love to your doorstep.
            </p>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-[#FAFAFA]">
          <div className="w-full max-w-[420px]">
            <div className="flex bg-[#F0F0F0] rounded-full p-1.5 mb-14 w-fit mx-auto">
              <button
                type="button"
                onClick={() => { setMode("login"); setError(''); }}
                className={`${mode === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"} rounded-full px-8 py-2.5 text-[14px] font-bold transition-colors`}
              >Sign In</button>
              <button
                type="button"
                onClick={() => { setMode("register"); setError(''); }}
                className={`${mode === "register" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"} rounded-full px-8 py-2.5 text-[14px] font-bold transition-colors`}
              >Create Account</button>
            </div>

            <h1 className="text-[40px] font-bold mb-3 text-gray-900 tracking-tight">
              {mode === "login" ? "Welcome Back" : "Join Freshinbasket"}
            </h1>
            <p className="text-gray-500 mb-10 text-[16px]">
              {mode === "login" ? "Healthy living starts with a single click. Let's get you in." : "Create your account and start shopping for organic freshness."}
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-[14px] text-red-700 text-sm font-medium">{error}</div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {mode === "register" && (
                <div>
                  <label className="block text-[13px] font-bold mb-2 text-gray-800">Full Name</label>
                  <input type="text" placeholder="John Doe" value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full bg-[#F3F4F1] border border-gray-200/60 rounded-[14px] px-5 py-4 text-[15px] focus:outline-none focus:border-[#1B3624] transition-colors placeholder:text-gray-400" />
                </div>
              )}
              <div>
                <label className="block text-[13px] font-bold mb-2 text-gray-800">Email Address</label>
                <input type="email" placeholder="hello@freshinbasket.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#F3F4F1] border border-gray-200/60 rounded-[14px] px-5 py-4 text-[15px] focus:outline-none focus:border-[#1B3624] transition-colors placeholder:text-gray-400" />
              </div>
              {mode === 'register' && (
                <div>
                  <label className="block text-[13px] font-bold mb-2 text-gray-800">Phone number</label>
                  <input type='tel' maxLength={10} placeholder="9893223232" value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-[#F3F4F1] border border-gray-200/60 rounded-[14px] px-5 py-4 text-[15px] focus:outline-none focus:border-[#1B3624] transition-colors placeholder:text-gray-400" />
                </div>
              )}
              <div>
                <label className="block text-[13px] font-bold mb-2 text-gray-800">Password</label>
                <input type="password" placeholder="••••••••" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-[#F3F4F1] border border-gray-200/60 rounded-[14px] px-5 py-4 text-[15px] focus:outline-none focus:border-[#1B3624] transition-colors placeholder:text-gray-400" />
              </div>
              {mode === 'register' && (
                <div>
                  <label className="block text-[13px] font-bold mb-2 text-gray-800">Confirm password</label>
                  <input type="password" placeholder="••••••••" value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full bg-[#F3F4F1] border border-gray-200/60 rounded-[14px] px-5 py-4 text-[15px] focus:outline-none focus:border-[#1B3624] transition-colors placeholder:text-gray-400" />
                </div>
              )}
              {mode === 'register' && (
                <div>
                  <label className="block text-[13px] font-bold mb-2 text-gray-800">Address</label>
                  <input type="text" placeholder="apartment building" value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full bg-[#F3F4F1] border border-gray-200/60 rounded-[14px] px-5 py-4 text-[15px] focus:outline-none focus:border-[#1B3624] transition-colors placeholder:text-gray-400" />
                </div>
              )}
              {mode === "login" && (
                <div className="flex justify-end pt-1">
                  <a href="#" className="text-[13px] font-bold text-[#8B2C2C] hover:underline">Forgot password?</a>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full bg-[#1B3624] text-white rounded-[14px] py-4 font-bold mt-2 hover:bg-[#132619] transition-colors text-[16px] shadow-lg shadow-[#1B3624]/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Please wait..." : (mode === "login" ? "Sign In" : "Create Account")}
              </button>
            </form>




          </div>
        </div>
      </main>

  
    </div>
  );
}
