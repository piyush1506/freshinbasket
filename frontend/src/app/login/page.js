"use client";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { AUTH_API, isAuthenticated, getAccessToken, getUser } from "@/lib/auth";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function AuthPage() {
  const { setUser, mergeCart } = useCart();
  const router = useRouter();
  
  // 'phone' | 'otp' | 'name'
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();
      if (user && !user.username) {
        if (step !== 'name') setStep('name');
      } else {
        router.replace('/');
      }
    }
  }, [router, step]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!phoneNumber || phoneNumber.length !== 10) {
      return setError("Please enter a valid 10-digit mobile number.");
    }
    
    setLoading(true);
    try {
      await AUTH_API.sendOtp(phoneNumber);
      toast.success('OTP sent successfully!');
      setStep('otp');
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!otpCode || otpCode.length !== 6) {
      return setError("Please enter a valid 6-digit OTP.");
    }

    setLoading(true);
    try {
      const data = await AUTH_API.verifyOtp(phoneNumber, otpCode);
      setUser(data.user);
      if (getAccessToken() && mergeCart) await mergeCart(getAccessToken());
      
      if (data.is_new_user || !data.user.username) {
        setStep('name');
      } else {
        toast.success('Login successful! Welcome back.');
        setTimeout(() => router.push("/"), 1500);
      }
    } catch (err) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setError("");
    if (!name || name.trim().length < 3) {
      return setError("Please enter a valid name (at least 3 characters).");
    }

    setLoading(true);
    try {
      await AUTH_API.updateProfile({ username: name.trim() });
      toast.success(`Welcome, ${name}! Your account is ready.`);
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-[#FAFAFA]">
      <nav className="flex justify-between items-center px-10 py-6 bg-[#FAFAFA]">
        <Link href="/" className="text-[28px] font-extrabold text-[#1B3624] tracking-tight">Freshinbasket</Link>
        <div className="flex gap-8 items-center">
          <div className="flex flex-col items-center">
            <button onClick={() => router.push('/')} className="text-gray-800 hover:text-black">
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

            <h1 className="text-[40px] font-bold mb-3 text-gray-900 tracking-tight">
              {step === 'phone' ? 'Welcome' : step === 'otp' ? 'Verify OTP' : 'Complete Profile'}
            </h1>
            <p className="text-gray-500 mb-10 text-[16px]">
              {step === 'phone' 
                ? 'Enter your mobile number to log in or create an account instantly.' 
                : step === 'otp'
                ? `We have sent a 6-digit code to +91 ${phoneNumber}`
                : 'Just one last step to complete your account!'
              }
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-[14px] text-red-700 text-sm font-medium">{error}</div>
            )}

            {step === 'phone' ? (
              <form className="space-y-5" onSubmit={handleSendOtp}>
                <div>
                  <label className="block text-[13px] font-bold mb-2 text-gray-800">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">+91</span>
                    <input 
                      type="tel" 
                      maxLength={10} 
                      placeholder="9876543210" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#F3F4F1] border border-gray-200/60 rounded-[14px] pl-14 pr-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#1B3624] transition-colors placeholder:text-gray-400" 
                    />
                  </div>
                </div>
                
                <button type="submit" disabled={loading || phoneNumber.length !== 10}
                  className="w-full bg-[#1B3624] flex items-center justify-center gap-2 text-white rounded-[14px] py-4 font-bold mt-2 hover:bg-[#132619] transition-colors text-[16px] shadow-lg shadow-[#1B3624]/20 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "Sending OTP..." : (
                    <>Get OTP <ArrowRight size={20} /></>
                  )}
                </button>
              </form>
            ) : step === 'otp' ? (
              <form className="space-y-5" onSubmit={handleVerifyOtp}>
                <div>
                  <label className="block text-[13px] font-bold mb-2 text-gray-800">6-Digit OTP</label>
                  <input 
                    type="text" 
                    maxLength={6} 
                    placeholder="Enter OTP" 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.5em] bg-[#F3F4F1] border border-gray-200/60 rounded-[14px] px-5 py-4 text-[20px] font-bold focus:outline-none focus:border-[#1B3624] transition-colors placeholder:text-gray-400 placeholder:tracking-normal" 
                  />
                </div>
                
                <button type="submit" disabled={loading || otpCode.length !== 6}
                  className="w-full bg-[#1B3624] flex items-center justify-center gap-2 text-white rounded-[14px] py-4 font-bold mt-2 hover:bg-[#132619] transition-colors text-[16px] shadow-lg shadow-[#1B3624]/20 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "Verifying..." : (
                    <>Verify & Proceed <CheckCircle2 size={20} /></>
                  )}
                </button>
                
                <div className="text-center pt-4">
                  <button type="button" onClick={() => setStep('phone')} className="text-sm font-bold text-gray-500 hover:text-gray-800 underline">
                    Change Mobile Number
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleUpdateName}>
                <div>
                  <label className="block text-[13px] font-bold mb-2 text-gray-800">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter your full name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#F3F4F1] border border-gray-200/60 rounded-[14px] px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#1B3624] transition-colors placeholder:text-gray-400" 
                  />
                </div>
                
                <button type="submit" disabled={loading || name.trim().length < 3}
                  className="w-full bg-[#1B3624] flex items-center justify-center gap-2 text-white rounded-[14px] py-4 font-bold mt-2 hover:bg-[#132619] transition-colors text-[16px] shadow-lg shadow-[#1B3624]/20 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "Saving..." : (
                    <>Start Shopping <ArrowRight size={20} /></>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 text-center text-[13px] text-gray-500 leading-relaxed">
              By continuing, you agree to our <br className="hidden md:block" />
              <Link href="/terms" className="text-[#1B3624] font-bold hover:underline">Terms and Conditions</Link> and{" "}
              <Link href="/privacy" className="text-[#1B3624] font-bold hover:underline">Privacy Policy</Link>.
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
