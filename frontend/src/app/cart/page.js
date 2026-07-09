"use client";

import Link from "next/link";
import { Trash2, ShoppingBag, ArrowLeft, Lock, Truck, Crosshair, RefreshCw, Minus, Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import Navbar from "../components/Navbar";
import VegetableCard from "../components/VegetableCard";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getAccessToken, authFetch } from "@/lib/auth";
import "leaflet/dist/leaflet.css";

export default function CartPage() {
  const router = useRouter()
  const { cartItems, removeFromCart, addToCart, clearCart, user, subtotal, deliveryCharge, grandTotal, storeSettings, taxAmount, hasTaxableItems, isFreeDhaniyaEligible, fetchCart } = useCart();
  const [deliverySlot, setDeliverySlot] = useState({ display_label: "7 AM - 12 PM", is_next_day: false });
  const [slotLoading, setSlotLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchSlot = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/delivery-slots/current/`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('Failed to fetch slot');
        const data = await res.json();
        if (mounted) {
          setDeliverySlot(data);
          setSlotLoading(false);
        }
      } catch {
        if (mounted) {
          setDeliverySlot({ display_label: "7 AM - 12 PM", is_next_day: false });
          setSlotLoading(false);
        }
      }
    };

    fetchSlot();
    return () => { mounted = false; controller.abort(); };
  }, []);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || "");
  const [pincode, setPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [lat, setLat] = useState(25.3471);
  const [lng, setLng] = useState(74.6408);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
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

  useEffect(() => {
    if (showAddressForm || cartItems.length === 0) return;
    const fetchSuggested = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/`);
        if (res.ok) {
          const data = await res.json();
          const cartItemIds = cartItems.map(item => item.id);
          const suggestions = data.filter(p => !cartItemIds.includes(p.id)).slice(0, 100);
          setSuggestedProducts(suggestions);
        }
      } catch (e) {
        console.error("Failed to fetch suggested products", e);
      }
    };
    fetchSuggested();
  }, [cartItems, showAddressForm]);

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      const data = await res.json();
      if (data?.display_name) {
        setDeliveryAddress(data.display_name);
        if (data.address?.postcode) {
          setPincode(data.address.postcode);
        }
      }
    } catch (error) {
      console.error("Geocoding error", error);
    }
  };

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

  const handleCartDecrement = async (item) => {
    const orderStep = Number(item.order_step) || 1;
    const minOrderQty = Number(item.min_order_qty) || 0;
    const newQty = parseFloat((item.quantity - orderStep).toFixed(3));
    if (newQty <= 0 || (minOrderQty > 0 && newQty < minOrderQty)) {
      removeFromCart(item.id);
    } else {
      addToCart({ ...item, quantity: -orderStep });
    }
  };

  const handleCartIncrement = (item) => {
    const orderStep = Number(item.order_step) || 1;
    addToCart({ ...item, quantity: orderStep });
  };

  const handleProceedToAddress = async () => {
    const token = getAccessToken()
    if (!token) return router.push('/login')

    const checkingToast = toast.loading("Checking product availability...");
    let freshCartItems = cartItems;
    try {
      const freshCart = await fetchCart();
      if (freshCart) {
        freshCartItems = freshCart;
      }
    } catch (e) {
      console.error("Failed to fetch fresh cart stock", e);
    } finally {
      toast.dismiss(checkingToast);
    }

    // Validate stock using the fresh cart items
    for (const item of freshCartItems) {
      if (item.stock !== undefined && item.quantity > item.stock) {
        toast.error(`Only ${item.stock} units of "${item.name}" available`);
        return;
      }
    }

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
            window.location.href = `/order-success/${verifyResult.order_id}`;
          } else {
            window.location.href = `/order-fail?reason=${encodeURIComponent(verifyResult.error || "Payment verification failed")}`;
          }
        } catch (err) {
          window.location.href = `/order-fail?reason=${encodeURIComponent("An error occurred during verification.")}`;
        }
      }
    };
    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        window.location.href = `/order-fail?reason=${encodeURIComponent(response.error?.description || "Payment failed")}`;
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
    if (!res.ok) {
      toast.error(data.error || "Failed to create COD order");
      return;
    }

    toast.success("COD order placed successfully! Pay on delivery.");
    clearCart();
    setTimeout(() => router.push(`/order-success/${data.order_id}`), 1500);
  };

  const handleCheckout = async () => {
    if (isProcessing) return;

    if (!deliveryAddress || !deliveryAddress.trim()) {
      toast.error("Please add a delivery address");
      return;
    }

    if (!isDeliverable) return;

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

  // Calculate distance for UI alert
  const BHILWARA_LAT = 25.3471;
  const BHILWARA_LNG = 74.6408;
  const R = 6371;
  const dLat = (lat - BHILWARA_LAT) * Math.PI / 180;
  const dLng = (lng - BHILWARA_LNG) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(BHILWARA_LAT * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const straightLineDistance = R * c;
  const distance = straightLineDistance * 1.3; // 1.3 multiplier for road driving distance estimation
  const maxDeliveryRadius = storeSettings?.max_delivery_radius ? parseFloat(storeSettings.max_delivery_radius) : 7;
  const isDeliverable = distance <= maxDeliveryRadius;

  return (
    <div className="w-full flex-grow bg-white">
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
                                  </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <div>
                    <span className="font-semibold text-gray-700">Coordinates: </span>
                    {lat}, {lng}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Distance: </span>
                    <span className={distance > 10 ? "text-red-600 font-bold" : "text-green-700 font-bold"}>
                      {distance.toFixed(2)} km
                    </span>
                  </div>
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

                {!isDeliverable && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-semibold border border-red-200 shadow-sm flex items-start gap-3">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      We currently do not provide services in your area. Delivery is restricted to a {maxDeliveryRadius}km radius within Bhilwara.
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing || !isDeliverable}
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
                  <div className="lg:col-span-2 space-y-3 min-w-0">

                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Product Image */}
                        <img
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-gray-100"
                        />

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate">
                            {item.name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">{item.unit || 'kg'} · ₹{parseInt(item.price)}/{item.unit || 'kg'}</p>

                          {/* Mobile: quantity + total inline */}
                          <div className="flex items-center gap-3 mt-2 sm:hidden">
                            {/* Stepper */}
                            <div className="flex items-center gap-1 bg-[#0c831f] text-white rounded-lg p-1 select-none">
                              <button
                                className="w-6 h-6 flex items-center justify-center hover:bg-green-800 rounded-md transition-colors"
                                onClick={() => handleCartDecrement(item)}
                              >
                                <Minus size={11} className="stroke-[3px]" />
                              </button>
                              <span className="text-xs font-extrabold px-1.5 min-w-[1.75rem] text-center">
                                {parseFloat(Number(item.quantity).toFixed(3))}
                              </span>
                              <button
                                className="w-6 h-6 flex items-center justify-center hover:bg-green-800 rounded-md transition-colors"
                                onClick={() => handleCartIncrement(item)}
                              >
                                <Plus size={11} className="stroke-[3px]" />
                              </button>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{item.unit || 'kg'}</span>
                            <span className="ml-auto font-bold text-gray-900 text-sm">₹{parseInt(item.price * (item.quantity || 1))}</span>
                          </div>
                        </div>

                        {/* Desktop: quantity + total + remove */}
                        <div className="hidden sm:flex items-center gap-4 shrink-0">
                          {/* Stepper */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 bg-[#0c831f] text-white rounded-lg p-1 select-none shadow-sm">
                              <button
                                className="w-7 h-7 flex items-center justify-center hover:bg-green-800 rounded-md transition-colors"
                                onClick={() => handleCartDecrement(item)}
                              >
                                <Minus size={12} className="stroke-[3px]" />
                              </button>
                              <span className="text-sm font-extrabold px-2 min-w-[2.5rem] text-center">
                                {parseFloat(Number(item.quantity).toFixed(3))}
                              </span>
                              <button
                                className="w-7 h-7 flex items-center justify-center hover:bg-green-800 rounded-md transition-colors"
                                onClick={() => handleCartIncrement(item)}
                              >
                                <Plus size={12} className="stroke-[3px]" />
                              </button>
                            </div>
                            <span className="text-xs font-bold text-gray-700">{item.unit || 'kg'}</span>
                          </div>

                          {/* Total */}
                          <div className="text-right min-w-[60px]">
                            <div className="font-bold text-gray-900 text-base">₹{parseInt(item.price * (item.quantity || 1))}</div>
                            {Number(item.tax_percentage) > 0 && (
                              <div className="text-[10px] font-medium text-amber-600">+{Number(item.tax_percentage)}% tax</div>
                            )}
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-600 hover:text-red-500 transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 size={18}  />
                          </button>
                        </div>

                        {/* Mobile remove button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="sm:hidden text-gray-300 hover:text-red-500 transition-colors shrink-0 self-start"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}

                    {/* Free Dhaniya Item */}
                    {isFreeDhaniyaEligible && storeSettings?.is_free_dhaniya_active && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-4 items-center shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                          Complimentary
                        </div>
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-green-100 flex items-center justify-center shrink-0 border border-green-200">
                          <span className="text-3xl">🌿</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-green-900 text-sm sm:text-base leading-tight truncate">
                            Fresh Coriander (Dhaniya)
                          </h3>
                          <p className="text-xs text-green-700 mt-0.5">1 Bunch</p>
                          <div className="flex items-center gap-3 mt-2 sm:hidden">
                            <span className="ml-auto font-bold text-green-700 text-sm">FREE</span>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-4 shrink-0 text-right min-w-[60px]">
                          <div className="font-bold text-green-700 text-base">FREE</div>
                        </div>
                      </div>
                    )}

                    {/* Continue Shopping */}
                    <Link
                      href="/"
                      className="flex items-center gap-2 text-green-700 hover:text-green-800 mt-6 font-semibold inline-flex"
                    >
                      <ArrowLeft size={18} />
                      Continue Shopping
                    </Link>

                    {/* Product Suggestions */}
                    {suggestedProducts.length > 0 && (
                      <div className="mt-10 w-full overflow-hidden">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">You might also like</h3>
                        <div className="flex overflow-x-auto pb-4 gap-4 sm:grid sm:grid-cols-3 md:grid-cols-4 sm:gap-6">
                          {suggestedProducts.map(item => (
                            <div key={item.id} className="w-[160px] sm:w-auto shrink-0 sm:shrink">
                              <VegetableCard item={item} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                            {slotLoading ? "Loading..." : `${deliverySlot.is_next_day ? "Tomorrow " : ""}${deliverySlot.display_label}`}
                          </span>
                        </div>

                        <div className="border-t border-gray-200 pt-4 flex justify-between">
                          <span className="text-lg font-bold text-gray-900">Total</span>
                          <span className="text-2xl font-bold text-gray-900">₹{parseInt(grandTotal)}</span>
                        </div>
                        
                        {storeSettings?.is_free_dhaniya_active && !isFreeDhaniyaEligible && (
                          <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg font-medium border border-amber-200 flex gap-2 items-start mt-4">
                            <span className="text-lg">🌿</span>
                            <span>Add more vegetables to reach {storeSettings.free_dhaniya_threshold_kg}kg and get free Dhaniya!</span>
                          </div>
                        )}
                        {storeSettings?.is_free_dhaniya_active && isFreeDhaniyaEligible && (
                          <div className="bg-green-50 text-green-800 text-xs p-3 rounded-lg font-medium border border-green-200 flex gap-2 items-start mt-4">
                            <span className="text-lg">🌿</span>
                            <span>Congrats! You've unlocked Free Dhaniya with this order!</span>
                          </div>
                        )}
                      </div>

                      {/* Checkout Button */}
                      <button
                        onClick={handleProceedToAddress}
                        className="w-full bg-green-900 hover:bg-green-800 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 mb-4"
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
