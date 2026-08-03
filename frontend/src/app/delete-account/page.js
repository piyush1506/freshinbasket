"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserX, ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import { AUTH_API, getAccessToken, isAuthenticated, getUser, authFetch } from "@/lib/auth";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

export default function DeleteAccountPage() {
  const router = useRouter();
  const { setUser, clearCart } = useCart();
  const [user, setLocalUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    const loggedIn = isAuthenticated();
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      const savedUser = getUser();
      setLocalUser(savedUser);
    }
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await AUTH_API.logout();
      setUser(null);
      clearCart();
      toast.success("Logged out successfully");
      setTimeout(() => router.push("/login"), 1000);
    } catch {
      toast.error("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/delete-account/`,
        { method: "DELETE" }
      );

      if (res.ok) {
        // Clear local auth data
        await AUTH_API.logout().catch(() => {});
        setUser(null);
        clearCart();
        setDeleted(true);
        toast.success("Account deleted successfully");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to delete account. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // After successful deletion
  if (deleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Deleted</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your account and all associated data have been permanently deleted. We're sorry to see you go.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={28} className="text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-500 text-sm mb-6">
            Please log in to manage your account or delete it.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <img src="/icon.png" alt="Freshinbasket" className="w-10 h-10 rounded-full" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          {user && (
            <p className="text-gray-500 text-sm mt-1">
              {user.username || user.phone_number}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {/* Logout Option */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <LogOut size={22} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">Log Out</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Sign out of your account. Your data will be preserved and you can log back in anytime.
                </p>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="mt-4 w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut size={16} />
                      Log Out
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Delete Account Option */}
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <UserX size={22} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">Delete Account</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Permanently delete your account and all associated data including order history, saved addresses, cart, and wishlist.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <UserX size={16} />
                    Delete My Account
                  </button>
                ) : (
                  <div className="mt-4 space-y-3">
                    {/* Warning */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-700 font-semibold flex items-start gap-2">
                        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                        This action is permanent and cannot be undone. All your data will be permanently removed.
                      </p>
                    </div>

                    {/* Confirmation input */}
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1.5">
                        Type <span className="font-bold text-red-600">DELETE</span> to confirm
                      </label>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                        placeholder="Type DELETE here"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        autoComplete="off"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowDeleteConfirm(false); setConfirmText(""); }}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || confirmText !== "DELETE"}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Confirm Delete"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Data Retention Notice */}
          <div className="bg-gray-100 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              Upon deletion, your personal data will be removed from our systems. Certain anonymized order records may be retained as required by law for tax and accounting purposes.
            </p>
          </div>

          {/* Back to app link */}
          <button
            onClick={() => router.push("/")}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 font-medium py-2 flex items-center justify-center gap-1"
          >
            <ArrowLeft size={14} />
            Back to Freshinbasket
          </button>
        </div>
      </div>
    </div>
  );
}
