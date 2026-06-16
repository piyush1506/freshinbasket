"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Save,
  X,
  Shield,
  Star,
  Award,
  Calendar,
  Truck,
  ChevronRight,
  Camera,
  Lock,
  Bell,
  Moon,
  Globe,
  LogOut,
  Loader2,
} from "lucide-react";
import { getAccessToken, AUTH_API } from "@/lib/auth";
import toast from "react-hot-toast";
import { uploadImage } from "@/lib/upload";

export default function ProfilePage() {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    username: "",
    email: "",
    phone_number: "",
    address: "",
    role: "DELIVERY",
    avatar: "",
  });

  const [editForm, setEditForm] = useState({ ...profile });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/delivery/profile/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setEditForm(data);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSave = async () => {
    const token = getAccessToken();
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/delivery/profile/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: editForm.username,
            email: editForm.email,
            phone_number: editForm.phone_number,
            address: editForm.address,
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const result = await uploadImage(file);
      const token = getAccessToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/delivery/profile/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ avatar: result.url }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => ({ ...prev, avatar: data.avatar }));
        toast.success("Avatar updated!");
      } else {
        toast.error("Failed to save avatar");
      }
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = async () => {
    await AUTH_API.logout();
    router.push("/login");
  };

  // Demo stats
  const stats = {
    totalDeliveries: 342,
    rating: 4.98,
    memberSince: "Jan 2024",
    onTimeRate: 96,
    badges: [
      { name: "Top Performer", icon: Award, color: "text-amber-600", bg: "bg-amber-100" },
      { name: "100+ Deliveries", icon: Truck, color: "text-blue-600", bg: "bg-blue-100" },
      { name: "Perfect Week", icon: Star, color: "text-purple-600", bg: "bg-purple-100" },
    ],
  };

  const displayProfile = profile.username
    ? profile
    : {
        username: "Marcus Reed",
        email: "marcus.reed@freshinbasket.com",
        phone_number: "9876543210",
        address: "42 Delivery Hub, Sector 12, Industrial Area",
        role: "DELIVERY",
      };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account and preferences
          </p>
        </div>
        {!editing ? (
          <button
            onClick={() => {
              setEditForm({ ...displayProfile });
              setEditing(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2D6A2E] text-white text-sm font-semibold rounded-xl hover:bg-[#245824] transition-all shadow-md shadow-green-900/15"
          >
            <Edit3 size={15} />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              <X size={15} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2D6A2E] text-white text-sm font-semibold rounded-xl hover:bg-[#245824] transition-all disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-[#2D6A2E] via-emerald-600 to-green-500 relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-20 w-40 h-40 border border-white/30 rounded-full"></div>
            <div className="absolute bottom-0 right-20 w-60 h-60 border border-white/20 rounded-full"></div>
          </div>
        </div>

        {/* Avatar & Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-700 to-emerald-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg overflow-hidden">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayProfile.username.charAt(0).toUpperCase()
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <Loader2 size={14} className="text-gray-500 animate-spin" />
                ) : (
                  <Camera size={14} className="text-gray-500" />
                )}
              </button>
            </div>

            {/* Name & Role */}
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">
                  {displayProfile.username}
                </h2>
                <span className="px-3 py-0.5 bg-green-100 text-green-700 text-[11px] font-bold rounded-full uppercase flex items-center gap-1">
                  <Shield size={11} />
                  Verified
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Delivery Partner • Member since {stats.memberSince}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-gray-900">
                  {stats.totalDeliveries}
                </p>
                <p className="text-xs text-gray-400">Deliveries</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-gray-900 flex items-center gap-1 justify-center">
                  <Star
                    size={16}
                    className="text-amber-500 fill-amber-500"
                  />
                  {stats.rating}
                </p>
                <p className="text-xs text-gray-400">Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-green-700">
                  {stats.onTimeRate}%
                </p>
                <p className="text-xs text-gray-400">On-Time</p>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 mt-5 flex-wrap">
            {stats.badges.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-2 ${badge.bg} rounded-xl`}
                >
                  <Icon size={14} className={badge.color} />
                  <span className="text-xs font-semibold text-gray-700">
                    {badge.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-5">
            Personal Information
          </h3>

          <div className="space-y-5">
            {/* Username */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <UserCircle size={18} className="text-gray-500" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {displayProfile.username}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Mail size={18} className="text-gray-500" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Email Address
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {displayProfile.email}
                  </p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Phone size={18} className="text-gray-500" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Phone Number
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={editForm.phone_number}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        phone_number: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    +91 {displayProfile.phone_number}
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-1">
                <MapPin size={18} className="text-gray-500" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Address
                </label>
                {editing ? (
                  <textarea
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                    rows={2}
                    className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {displayProfile.address || "Not set"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="space-y-4">
          {/* Quick Settings */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Settings
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                {
                  icon: Bell,
                  label: "Notifications",
                  desc: "Push & SMS alerts",
                  color: "text-blue-600",
                  bg: "bg-blue-100",
                },
                {
                  icon: Lock,
                  label: "Change Password",
                  desc: "Security settings",
                  color: "text-red-600",
                  bg: "bg-red-100",
                },
                {
                  icon: Moon,
                  label: "Appearance",
                  desc: "Theme preferences",
                  color: "text-purple-600",
                  bg: "bg-purple-100",
                },
                {
                  icon: Globe,
                  label: "Language",
                  desc: "English",
                  color: "text-green-600",
                  bg: "bg-green-100",
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center`}
                    >
                      <Icon size={16} className={item.color} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
