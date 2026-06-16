"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./MapComponent"), { 
    ssr: false, 
    loading: () => (
        <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-400" />
        </div>
    ) 
});

export default function ChangeAddressModal({ isOpen, onClose, onSubmit, initialAddress, initialLat, initialLng }) {
    const [address, setAddress] = useState(initialAddress || "");
    const [position, setPosition] = useState(
        initialLat && initialLng ? { lat: parseFloat(initialLat), lng: parseFloat(initialLng) } : { lat: 28.6139, lng: 77.2090 }
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAddress(initialAddress || "");
            setPosition(initialLat && initialLng ? { lat: parseFloat(initialLat), lng: parseFloat(initialLng) } : { lat: 28.6139, lng: 77.2090 });
            if (!initialLat && "geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                });
            }
        }
    }, [isOpen, initialAddress, initialLat, initialLng]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit(address, position.lat, position.lng);
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900">Change Delivery Address</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="h-64 rounded-xl overflow-hidden mb-6 border border-gray-200">
                        <MapComponent position={position} setPosition={setPosition} />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Complete Address
                            </label>
                            <div className="relative">
                                <div className="absolute top-3 left-3 text-gray-400">
                                    <MapPin size={18} />
                                </div>
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter your full delivery address (House No, Street, City)"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all resize-none h-24"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !address.trim()}
                                className="flex-1 px-4 py-2.5 bg-green-800 text-white font-medium rounded-xl hover:bg-green-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : "Save Address"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
