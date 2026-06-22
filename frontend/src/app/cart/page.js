"use client";

import Link from "next/link";
import { Trash2, ShoppingBag, ArrowLeft, Lock, Truck, Crosshair, RefreshCw } from "lucide-react";
import { useCart } from "../context/CartContext";
import Navbar from "../components/Navbar";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getAccessToken, authFetch } from "@/lib/auth";
import "leaflet/dist/leaflet.css";

export default function CartPage() {
  const router = useRouter()
  const { cartItems, removeFromCart, addToCart, clearCart, user, subtotal, deliveryCharge, grandTotal, storeSettings, taxAmount, hasTaxableItems } = useCart();
  const deliverySlot = (() => {
    const hour = new Date().getHours();
    if (hour >= 22) return { label: "7 AM - 10 AM", slot: "early-morning" };
    if (hour < 12) return { label: "7 AM - 12 PM", slot: "morning" };
    return { label: "4 PM - 10 PM", slot: "evening" };
  })();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || "");
  const [pincode, setPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [lat, setLat] = useState(25.3471);
  const [lng, setLng] = useState(74.6408);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (typeof window.Razorpay !== 'undefined') {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => console.error("Failed to load Razorpay script");
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  // Load Leaflet from npm when address form opens
  useEffect(() => {
    if (!showAddressForm) return;
    let mounted = true;
    (async () => {
      const L = await import("leaflet");
      if (!mounted) return;
      initMap(L);
    })();
    return () => {
      mounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [showAddressForm]);

  const initMap = (L) => {
    if (mapInstance.current) {
      mapInstance.current.invalidateSize();
      return;
    }
    if (!mapRef.current) return;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
    
    if (mapRef.current._leaflet_id) {
      mapRef.current._leaflet_id = null;
    }
    
    const map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setLat(pos.lat.toFixed(6));
      setLng(pos.lng.toFixed(6));
      reverseGeocode(pos.lat, pos.lng);
    });
    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      setLat(e.latlng.lat.toFixed(6));
      setLng(e.latlng.lng.toFixed(6));
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
    mapInstance.current = map;
    markerRef.current = marker;
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      const data = await res.json();
      if (data?.display_name) {
        setDeliveryAddress(data.display_name);
      }
    } catch { }
  };
  const waitforMap = () => new Promise((resolve) => {
    if (mapInstance.current && markerRef.current) return resolve()
    const interval = setInterval(() => {
      if (mapInstance.current && markerRef.current) {
        clearInterval(interval)
        resolve()

      }
    }, 100)
    setTimeout(() => {
      clearInterval(interval);
      resolve()
    }, 5000);
  })

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error('geolocation is not support by your browser');


    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude.toFixed(6));
        setLng(longitude.toFixed(6));
        await waitforMap()
        if (markerRef.current && mapInstance.current) {
          markerRef.current.setLatLng([latitude, longitude]);
          mapInstance.current.setView([latitude, longitude], 14);
        }
        reverseGeocode(latitude, longitude);
      },

      (err) => {
        const messages = {
          1: "Location permission denied. Please allow access in your browser settings.",
          2: "Location unavailable. Check your device settings.",
          3: "Location request timed out. Try again.",
        }
        toast.error(messages[err.code] || "Unable to retrieve your location.")
        console.error('geolocation error', err.message)
      }
    );
  };

  const handleQuantityChange = (item, newQuantity) => {
    const currentQuantity = item.quantity || 1
    const difference = newQuantity - currentQuantity;
    if (difference !== 0) {
      addToCart({ ...item, quantity: difference });
    }
  }

  const handleProceedToAddress = () => {
    const token = getAccessToken()
    if (!token) return router.push('/login')
    setShowAddressForm(true);
    setTimeout(() => {
      if (mapInstance.current) mapInstance.current.invalidateSize();
    }, 300);
  };

  const handleOnlinePayment = async (fullAddress) => {
    if (!razorpayLoaded || typeof window.Razorpay === 'undefined') {
      toast.error("Payment gateway is still loading. Please try again.");
      return;
    }

    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payment/create-order/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cartItems.map(item => ({
          product_id: item.id,
          price: item.price,
          quantity: item.quantity || 1
        }))
      })
    });

    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Failed to create payment order");

    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      order_id: data.order_id,
      name: 'Freshinbasket',
      description: 'Payment for your organic harvest',
      prefill: {
        name: user?.username || 'Guest User',
        email: user?.email || 'guest@example.com',
        contact: user?.phone_number || '9999999999'
      },
      modal: {
        ondismiss: function() {
          toast.error("Payment cancelled");
          setIsProcessing(false);
        }
      },
      handler: async function (response) {
        try {
          const verifyRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payment/verify/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              delivery_address: fullAddress,
              delivery_latitude: lat,
              delivery_longitude: lng
            })
          });
          const verifyResult = await verifyRes.json();
          if (verifyRes.ok) {
            toast.success("Payment verified and order created successfully!");
            clearCart();
            window.location.href = "/";
          } else {
            toast.error(verifyResult.error || "Payment verification failed");
          }
        } catch (err) {
          toast.error("An error occurred during verification.");
        }
      }
    };
    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(response.error?.description || "Payment failed");
      });
      rzp.open();
    } catch (err) {
      toast.error("Failed to open payment gateway. Please try again.");
      console.error("Razorpay error:", err);
    }
  };

  const handleCODCheckout = async (fullAddress) => {
    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payment/cod/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        delivery_address: fullAddress,
        delivery_latitude: lat,
        delivery_longitude: lng
      })
    });

    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Failed to create COD order");

    toast.success("COD order placed successfully! Pay on delivery.");
    clearCart();
    setTimeout(() => router.push("/"), 1500);
  };

  const handleCheckout = async () => {
    if (isProcessing) return;
    const token = getAccessToken()
    if (!token) return router.push('/login')

    const fullAddress = `${deliveryAddress}${pincode ? `, Pincode: ${pincode}` : ""}`;

    setIsProcessing(true);
    try {
      if (paymentMethod === "cod") {
        await handleCODCheckout(fullAddress);
      } else {
        await handleOnlinePayment(fullAddress);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {showAddressForm ? (
          <>
            <button
              onClick={() => setShowAddressForm(false)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
            >
              <ArrowLeft size={18} />
              Back to Cart
            </button>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Delivery Address</h1>
            <p className="text-gray-500 text-sm mb-6">Select your location on the map or enter details manually.</p>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200" style={{ height: 400 }} ref={mapRef} />
                <button
                  onClick={useCurrentLocation}
                  className="flex items-center gap-2 mt-3 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Crosshair size={16} />
                  Use My Current Location
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Address</label>
                  <textarea
                    rows={4}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-700 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                    placeholder="6-digit pincode"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-700"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-700">Coordinates: </span>
                  {lat}, {lng}
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest mb-3 block">Payment Method</label>
                  <div className="space-y-3">
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${paymentMethod === "online" ? "border-green-700 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="online"
                        checked={paymentMethod === "online"}
                        onChange={() => setPaymentMethod("online")}
                        className="accent-green-700"
                      />
                      <div className="flex-1">
                        <span className="block text-sm font-semibold text-gray-900">Pay Online</span>
                        <span className="block text-xs text-gray-500">Razorpay (Credit Card, UPI, Net Banking)</span>
                      </div>
                      <Lock size={18} className="text-green-600 shrink-0" />
                    </label>
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${paymentMethod === "cod" ? "border-green-700 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        className="accent-green-700"
                      />
                      <div className="flex-1">
                        <span className="block text-sm font-semibold text-gray-900">Cash on Delivery</span>
                        <span className="block text-xs text-gray-500">Pay when you receive your order</span>
                      </div>
                      <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125V9M7.5 10.5h5.25m-5.25 3h5.25" />
                      </svg>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Lock size={18} />}
                  {isProcessing ? "Processing..." : (paymentMethod === "cod" ? `Place COD Order — ₹${parseInt(grandTotal)}` : `Confirm Address & Pay ₹${parseInt(grandTotal)}`)}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {cartItems.length === 0 ? (
              <div className="bg-white rounded-lg p-10 text-center">
                <ShoppingBag
                  size={80}
                  className="mx-auto text-gray-300 mb-4"
                />
                <h2 className="text-2xl font-semibold mb-2">
                  Your cart is empty
                </h2>
                <p className="text-gray-500 mb-6">
                  Add some fresh vegetables and fruits.
                </p>

                <Link
                  href="/"
                  className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 inline-block"
                >
                  Shop Now
                </Link>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-8 text-gray-900">Shopping Cart</h1>

                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Cart Items Section */}
                  <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      {/* Table Header */}
                      <div className="hidden md:grid grid-cols-6 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 text-sm">
                        <div className="col-span-2">Product</div>
                        <div>Price</div>
                        <div>Quantity</div>
                        <div>Total</div>
                        <div></div>
                      </div>

                      {/* Cart Items */}
                      <div className="divide-y divide-gray-200">
                        {cartItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col md:grid md:grid-cols-6 gap-4 px-4 py-4 md:px-6 md:items-center relative"
                          >
                            {/* Product Info */}
                            <div className="md:col-span-2 flex gap-4 pr-10 md:pr-0">
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover"
                                />
                              )}
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {item.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {item.size || "Standard"}
                                </p>
                                <div className="text-gray-900 font-semibold md:hidden mt-1">
                                  ₹{parseInt(item.price)}/{item.unit || 'kg'}
                                </div>
                              </div>
                            </div>

                            {/* Price (Desktop only) */}
                            <div className="hidden md:block text-gray-900 font-semibold">
                              ₹{parseInt(item.price)}/{item.unit || 'kg'}
                            </div>

                            {/* Mobile bottom row / Desktop columns */}
                            <div className="flex items-center justify-between mt-2 md:mt-0 md:contents">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit md:col-span-1">
                                <button
                                  className="px-2 py-1 hover:bg-gray-200 rounded"
                                  onClick={() => {
                                    if (item.quantity > 1) {
                                      handleQuantityChange(item, item.quantity - 1);
                                    }
                                  }}
                                >
                                  −
                                </button>
                                <span className="px-3 py-1 text-center min-w-[30px]">
                                  {item.quantity || 1}
                                </span>
                                <button
                                  className="px-2 py-1 hover:bg-gray-200 rounded"
                                  onClick={() => handleQuantityChange(item, (item.quantity || 1) + 1)}
                                >
                                  +
                                </button>
                              </div>

                              {/* Total */}
                              <div className="font-semibold text-gray-900 md:col-span-1">
                                <span className="md:hidden text-gray-500 text-sm font-normal mr-2">Total:</span>
                                ₹{parseInt(item.price * (item.quantity || 1))}
                                {Number(item.tax_percentage) > 0 && (
                                  <div className="text-[10px] font-medium text-amber-600">+{Number(item.tax_percentage)}% tax</div>
                                )}
                              </div>
                            </div>

                            {/* Remove Button */}
                            <div className="absolute top-4 right-4 md:static md:col-span-1 md:text-right">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:text-red-700 transition"
                              >
                                <span className="md:hidden"><Trash2 size={18} /></span>
                                <span className="hidden md:inline">Remove</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Continue Shopping */}
                    <Link
                      href="/"
                      className="flex items-center gap-2 text-green-700 hover:text-green-800 mt-6 font-semibold"
                    >
                      <ArrowLeft size={18} />
                      Continue Shopping
                    </Link>
                  </div>

                  {/* Order Summary Sidebar */}
                  <div className="lg:col-span-1">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
                      <h2 className="text-xl font-bold mb-6 text-gray-900">
                        Order Summary
                      </h2>

                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal ({cartItems.length} items)</span>
                          <span className="font-semibold text-gray-900">₹{parseInt(subtotal)}</span>
                        </div>

                        <div className="flex justify-between text-gray-600">
                          <span>Delivery Charge {deliveryCharge === 0 ? `(Orders above ₹${parseInt(storeSettings?.free_delivery_threshold || 100)})` : ''}</span>
                          <span className={deliveryCharge === 0 ? "font-semibold text-green-700" : "font-semibold text-gray-900"}>
                            {deliveryCharge === 0 ? "FREE" : `₹${parseInt(deliveryCharge)}`}
                          </span>
                        </div>

                        {hasTaxableItems && (
                          <div className="flex justify-between text-gray-600">
                            <span>Tax</span>
                            <span className="font-semibold text-gray-900">₹{taxAmount.toFixed(2)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-gray-600">
                          <span>Delivery Slot</span>
                          <span className="font-semibold text-gray-900 bg-green-50 text-green-800 text-xs px-2 py-1 rounded-full">
                            {deliverySlot.label}
                          </span>
                        </div>

                        <div className="border-t border-gray-200 pt-4 flex justify-between">
                          <span className="text-lg font-bold text-gray-900">Total</span>
                          <span className="text-2xl font-bold text-gray-900">₹{parseInt(grandTotal)}</span>
                        </div>
                      </div>

                      {/* Checkout Button */}
                      <button
                        onClick={handleProceedToAddress}
                        className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 mb-4"
                      >
                        <Lock size={18} />
                        Proceed to Checkout
                      </button>

                      {/* Trust Badges */}
                      <div className="space-y-2 text-center text-sm text-gray-600">
                        <div className="flex justify-center gap-2">
                          <Lock size={16} />
                          <Truck size={16} />
                          <ShoppingBag size={16} />
                        </div>
                        <p>Need help?</p>
                        <p className="text-gray-500">Live chat with a specialist</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
