"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import ChangeAddressModal from "../components/ChangeAddressModal";
import OrderDetailModal from "../components/OrderDetailModal";
import ReviewModal from "../components/ReviewModal";
import CancelOrderModal from "../components/CancelOrderModal";
import { getAccessToken } from "@/lib/auth";
import { ArrowLeft, Truck, CheckCircle2, RotateCcw, Star, ChevronDown, SlidersHorizontal, MapPin, XCircle } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const tabs = ["All Orders", "Active", "Past Orders"];

function StatusBadge({ status, label }) {
    if (status === "PENDING" || status === "OUT_FOR_DELIVERY") {

        return (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-800 text-white text-xs font-medium rounded-full">
                <Truck size={12} />
                {label || status}
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1.5 px-3 py-1 border border-gray-300 text-gray-600 text-xs font-medium rounded-full">
            <CheckCircle2 size={12} className="text-green-600" />
            {label || status}
        </span>
    );
}

function ActiveBadge() {
    return (
        <span className="px-2 py-0.5 bg-green-700 text-white text-[10px] font-bold rounded uppercase tracking-wide">
            Active
        </span>
    );
}

export default function OrdersPage() {
    const [activeTab, setActiveTab] = useState("All Orders");
    const [timeFilter, setTimeFilter] = useState("30_DAYS");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [selectedOrderForAddress, setSelectedOrderForAddress] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedOrderForCancel, setSelectedOrderForCancel] = useState(null);
    const { user, addToCart } = useCart();
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            const token = getAccessToken();
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data);
                }
            } catch (err) {
                console.error("Failed to fetch orders:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [router]);

    const handleAddressUpdate = async (newAddress, lat, lng) => {
        if (!selectedOrderForAddress) return;
        if (selectedOrderForAddress.status === "OUT_FOR_DELIVERY") {
            toast.error("Address cannot be changed after the order is out for delivery.");
            return;
        }

        try {
            const token = getAccessToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${selectedOrderForAddress.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    delivery_address: newAddress,
                    delivery_latitude: lat.toFixed(6),
                    delivery_longitude: lng.toFixed(6)
                })
            });

            if (res.ok) {
                setOrders(prevOrders => prevOrders.map(order =>
                    order.id === selectedOrderForAddress.id
                        ? { ...order, delivery_address: newAddress, delivery_latitude: lat.toFixed(6), delivery_longitude: lng.toFixed(6) }
                        : order
                ));
            } else {
                let errData;
                try {
                    errData = await res.json();
                } catch (e) { }
                console.error("Failed to update address:", errData || res.statusText);
                toast.error(errData?.error || "Failed to update address.");
            }
        } catch (error) {
            console.error("Error updating address:", error);
            toast.error("Error updating address.");
        }
    };

    const handleReviewSubmitted = (review) => {
        setOrders((prevOrders) =>
            prevOrders.map((o) =>
                o.id === selectedOrderForReview?.id ? { ...o, review } : o
            )
        );
    };

    const handleReorder = async (order) => {
        try {
            for (const item of order.items) {
                await addToCart({
                    id: item.product,
                    quantity: item.quantity,
                    name: item.product_name,
                    price: item.unit_price
                });
            }
            toast.success("Order items added to cart!");
            router.push('/cart');
        } catch (error) {
            console.error("Failed to reorder:", error);
            toast.error("Failed to reorder items.");
        }
    };

    const handleCancelOrder = async (orderId, reason) => {
        setIsCancelModalOpen(false);
        try {
            const token = getAccessToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${orderId}/cancel/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success("Order cancelled successfully");
                setOrders(prevOrders => prevOrders.map(order =>
                    order.id === orderId ? { ...order, status: data.status || "CANCELLED" } : order
                ));
            } else {
                let errData;
                try { errData = await res.json(); } catch (e) { }
                toast.error(errData?.error || "Failed to cancel order.");
            }
        } catch (error) {
            console.error("Error cancelling order:", error);
            toast.error("Error cancelling order.");
        }
    };

    if (loading) {
        return (
            <>
                <div className="max-w-5xl  ">

                    <Navbar className='w-full' />
                    <div className="max-w-5xl mx-auto  md:px-2 py-12">
                        <Link href="/" className="text-gray-400 hover:text-gray-600 inline-flex mb-6">
                            <ArrowLeft size={20} />
                        </Link>
                        <p className="text-gray-500 font-medium text-center">Loading orders...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>

            <Navbar />
            <div className="max-w-5xl mx-auto px-1 md:px-6 ">
                <div className="max-w-5xl mx-auto px-1 md:px-6 py-8">
                    <div className="flex items-center gap-3 mb-5">
                        <Link href="/" className="text-gray-400 hover:text-gray-600">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
                            <p className="text-gray-500 text-sm mt-1">Track your freshness from farm to front door.</p>
                        </div>
                    </div>

                    {/* Tabs + Filter */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 mb-6 gap-4 md:gap-0">
                        <div className="flex overflow-x-auto no-scrollbar w-full">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab
                                        ? "border-green-900 text-green-900"
                                        : "border-transparent text-gray-500 hover:text-gray-800"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="relative flex items-center mb-2">
                            <SlidersHorizontal size={14} className="absolute left-3 text-gray-500 pointer-events-none" />
                            <select
                                value={timeFilter}
                                onChange={(e) => setTimeFilter(e.target.value)}
                                className="pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-green-700"
                            >
                                <option value="30_DAYS">Last 30 Days</option>
                                <option value="6_MONTHS">Last 6 Months</option>
                                <option value="1_YEAR">Last 1 Year</option>
                                <option value="ALL">All Time</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    {/* Orders List */}
                    <div className="flex flex-col gap-4">
                        {orders.length === 0 ? (
                            <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl">
                                <p className="text-gray-500 mb-4">You have no orders yet.</p>
                                <Link href="/" className="px-6 py-2 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-900 transition-colors">
                                    Start Shopping
                                </Link>
                            </div>
                        ) : (
                            (() => {
                                const filteredOrders = orders.filter(order => {
                                    if (activeTab === "Active") {
                                        if (!["PENDING", "CONFIRMED", "OUT_FOR_DELIVERY"].includes(order.status)) return false;
                                    }
                                    if (activeTab === "Past Orders") {
                                        if (!["DELIVERED", "CANCELLED"].includes(order.status)) return false;
                                    }

                                    if (timeFilter !== "ALL" && order.created_at) {
                                        const orderDate = new Date(order.created_at);
                                        const now = new Date();
                                        if (timeFilter === "30_DAYS") {
                                            const limit = new Date();
                                            limit.setDate(now.getDate() - 30);
                                            if (orderDate < limit) return false;
                                        } else if (timeFilter === "6_MONTHS") {
                                            const limit = new Date();
                                            limit.setMonth(now.getMonth() - 6);
                                            if (orderDate < limit) return false;
                                        } else if (timeFilter === "1_YEAR") {
                                            const limit = new Date();
                                            limit.setFullYear(now.getFullYear() - 1);
                                            if (orderDate < limit) return false;
                                        }
                                    }

                                    return true;
                                });

                                if (filteredOrders.length === 0) {
                                    return (
                                        <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl">
                                            <p className="text-gray-500">No orders found for this category.</p>
                                        </div>
                                    );
                                }

                                return filteredOrders.map((order) => {
                                    const isStatusActive = ["PENDING", "CONFIRMED", "OUT_FOR_DELIVERY"].includes(order.status);
                                    const canChangeAddress = ["PENDING", "CONFIRMED"].includes(order.status);
                                    return (
                                        <div
                                            key={order.id}
                                            className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors p-5"
                                        >
                                            <div className="flex flex-col md:flex-row gap-6">
                                                {/* Content */}
                                                <div className="flex-1 flex flex-col justify-between">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <h3 className="font-bold text-gray-900 text-lg">
                                                                    Order {order.order_number ? `#${order.order_number}` : `#${order.id}`}
                                                                </h3>
                                                                {isStatusActive && <ActiveBadge />}
                                                            </div>
                                                            <p className="text-xs text-gray-400 mt-1" suppressHydrationWarning>
                                                                Placed: {new Date(order.created_at).toLocaleDateString()}
                                                            </p>

                                                            <div className="mt-4 space-y-1">
                                                                {order.items && order.items.map(item => (
                                                                    <p key={item.id} className="text-sm text-gray-600 leading-relaxed">
                                                                        {item.quantity} {item.unit_name || 'kg'} {item.product_name}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                            {
                                                                order.delivery_address && (
                                                                    <div className="mt-3 flex items-start gap-2 w-full">
                                                                        <MapPin size={17} className="text-gray-400 mt-0.5 shrink-0" />
                                                                        <p className="text-xs text-gray-400 leading-relaxed break-words min-w-0 flex-1">
                                                                            {order.delivery_address}
                                                                        </p>
                                                                    </div>
                                                                )
                                                            }
                                                        </div>
                                                        <div className="sm:relative right-4 top-4">
                                                            <StatusBadge status={order.status} label={order.status.replace("_", " ")} />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between mt-6 pt-4 border-t border-gray-100 gap-4">
                                                        <div>
                                                            <div className="text-[11px] text-gray-400 uppercase tracking-widest">Total</div>
                                                            <div className="text-xl font-bold text-gray-900">₹{order.total_amount}</div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            {order.status === "DELIVERED" && !order.review && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedOrderForReview(order);
                                                                        setIsReviewModalOpen(true);
                                                                    }}
                                                                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 text-sm font-medium rounded-xl hover:bg-amber-100 transition-colors whitespace-nowrap border border-amber-200"
                                                                >
                                                                    <Star size={14} />
                                                                    Rate
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleReorder(order)}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors whitespace-nowrap"
                                                            >
                                                                <RotateCcw size={14} />
                                                                Reorder
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedOrderForDetail(order);
                                                                    setIsDetailModalOpen(true);
                                                                }}
                                                                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                                                            >
                                                                Details
                                                            </button>
                                                            {/* Removed Cancel button from list, moved to Details modal */}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            })()
                        )}
                    </div>
                </div>
            </div>

            <ChangeAddressModal
                isOpen={isAddressModalOpen}
                onClose={() => {
                    setIsAddressModalOpen(false);
                    setSelectedOrderForAddress(null);
                }}
                onSubmit={handleAddressUpdate}
                initialAddress={selectedOrderForAddress?.delivery_address}
                initialLat={selectedOrderForAddress?.delivery_latitude}
                initialLng={selectedOrderForAddress?.delivery_longitude}
            />

            <OrderDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedOrderForDetail(null);
                }}
                order={selectedOrderForDetail}
                onReviewClick={(order) => {
                    setIsDetailModalOpen(false);
                    setSelectedOrderForReview(order);
                    setIsReviewModalOpen(true);
                }}
                onCancelClick={(orderId) => {
                    setIsDetailModalOpen(false);
                    const orderToCancel = orders.find(o => o.id === orderId);
                    if (orderToCancel) {
                        setSelectedOrderForCancel(orderToCancel);
                        setIsCancelModalOpen(true);
                    }
                }}
            />

            <ReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => {
                    setIsReviewModalOpen(false);
                    setSelectedOrderForReview(null);
                }}
                order={selectedOrderForReview}
                onReviewSubmitted={handleReviewSubmitted}
            />

            <CancelOrderModal
                isOpen={isCancelModalOpen}
                onClose={() => {
                    setIsCancelModalOpen(false);
                    setSelectedOrderForCancel(null);
                }}
                order={selectedOrderForCancel}
                onSubmit={handleCancelOrder}
            />
        </>
    );
}
