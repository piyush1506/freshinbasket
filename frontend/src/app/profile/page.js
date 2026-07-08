"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { getAccessToken, setUser as saveUser, AUTH_API } from "@/lib/auth";
import { ArrowLeft, LogOut, UserX, MapPin } from "lucide-react";

const tabs = ["Personal Information", "Delivery Addresses"];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Personal Information");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [reqId, setReqId] = useState('');

  const router = useRouter();
  const { user, setUser } = useCart();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: '',
    address: '',
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    // Check if the phone number has changed and we need to send OTP first
    const isPhoneChanged = formData.phone_number !== (user?.phone_number || '');

    if (isPhoneChanged && !otpSent) {
      try {
        const data = await AUTH_API.sendOtp(formData.phone_number);
        setReqId(data.reqId);
        setOtpSent(true);
        setSuccess('OTP sent to your new phone number!');
      } catch (err) {
        setError(err.message || 'Failed to send OTP. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const token = getAccessToken();
      const payload = {
        ...formData,
      };
      if (otpSent) {
        payload.otp_code = otpCode;
        payload.reqId = reqId;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.phone_number?.[0] || data?.email?.[0] || data?.username?.[0] || 'Update failed');
        return;
      }

      setUser(data);
      saveUser(data);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setOtpSent(false);
      setOtpCode('');
      setReqId('');

    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AUTH_API.logout();
    setUser(null);
    router.push('/login');
  };

  if (!isMounted) return null;

  return (
    <>
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your account details and delivery preferences.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-200 mb-8">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab
                  ? "border-green-900 text-green-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
                }`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 sm:grid-cols-1 gap-6">
          {/* Sidebar */}
          <div className=" shrink-0 sm:w-full md:w-72">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex flex-col items-center pb-5 border-b border-gray-100">
                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <span className="text-3xl font-bold text-green-800">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="font-semibold text-gray-900 text-lg">{user?.username}</h2>
                <div className="flex items-center gap-1 text-amber-600 text-sm mt-1">
                  <span className="w-4 h-4 rounded-full  text-white text-[10px] flex items-center justify-center font-bold"></span>
                  Member
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col gap-4">

            {success && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                ✅ {success}
              </div>
            )}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                ❌ {error}
              </div>
            )}

            {activeTab === "Personal Information" && (
              <>
                {/* Personal Information Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h3 className="font-semibold text-gray-900">Personal Information</h3>
                      <p className="text-sm text-gray-400">Basic details for your account.</p>
                    </div>

                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setIsEditing(false); setError(''); setSuccess(''); setOtpSent(false); setOtpCode(''); }}
                          className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdate}
                          disabled={loading}
                          className="px-4 py-1.5 bg-green-800 text-white rounded-lg text-sm font-medium hover:bg-green-900 disabled:opacity-50"
                        >
                          {otpSent ? (loading ? 'Verifying...' : 'Verify & Save') : (loading ? 'Saving...' : 'Save')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <div>
                      <div className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">Username</div>
                      {isEditing ? (
                        <input name="username" value={formData.username} onChange={handleChange}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-700" />
                      ) : (
                        <div className="text-sm font-semibold text-gray-800">{user?.username || '—'}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">Email Address</div>
                      {isEditing ? (
                        <input name="email" value={formData.email} onChange={handleChange}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-700" />
                      ) : (
                        <div className="text-sm font-semibold text-gray-800">{user?.email || '—'}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">Phone Number</div>
                      {isEditing ? (
                        <input name="phone_number" value={formData.phone_number} onChange={handleChange} maxLength={10} disabled={otpSent}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-700 disabled:bg-gray-100" />
                      ) : (
                        <div className="text-sm font-semibold text-gray-800">{user?.phone_number || '—'}</div>
                      )}
                    </div>

                    {otpSent && isEditing && (
                      <div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-widest mb-1 font-semibold text-green-800">Enter OTP Code</div>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          maxLength={6}
                          placeholder="Enter 6-digit OTP"
                          className="w-full border border-green-500 bg-green-50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-700"
                        />
                      </div>
                    )}

                    <div>
                      <div className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">Delivery Address</div>
                      {isEditing ? (
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          rows={3}
                          placeholder="Enter your full street address, apartment number, etc."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-700 resize-none"
                        />
                      ) : (
                        <div className="text-sm font-semibold text-gray-800 whitespace-pre-wrap">{user?.address || '—'}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <LogOut size={16} />Log Out
                  </button>
                  <button className="flex items-center gap-2 px-6 py-2.5 border border-red-300 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50">
                    <UserX size={16} />Deactivate Account
                  </button>
                </div>
              </>
            )}

            {activeTab === "Delivery Addresses" && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-semibold text-gray-900">Delivery Addresses</h3>
                    <p className="text-sm text-gray-400">Your saved delivery address.</p>
                  </div>
                </div>

                {user?.address ? (
                  <div className="border border-green-200 bg-green-50/50 rounded-xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={18} className="text-green-700" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">Home</h4>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Default</span>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{user.address}</p>
                      {user?.phone_number && (
                        <p className="text-xs text-gray-400 mt-2">📞 {user.phone_number}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <MapPin size={24} className="text-gray-400" />
                    </div>
                    <h4 className="font-semibold text-gray-700 mb-1">No address saved</h4>
                    <p className="text-sm text-gray-400 mb-4">Add a delivery address from your Personal Information tab.</p>
                    <button
                      onClick={() => { setActiveTab("Personal Information"); setIsEditing(true); }}
                      className="px-5 py-2 bg-green-800 text-white rounded-lg text-sm font-medium hover:bg-green-900"
                    >
                      Add Address
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
