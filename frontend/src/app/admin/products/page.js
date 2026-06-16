"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Upload,
  Loader2,
  Search,
  ArrowLeft,
  ImageIcon,
} from "lucide-react";
import { getAccessToken, getUser } from "@/lib/auth";
import toast from "react-hot-toast";

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }
    const user = getUser();
    if (!user || user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/`
      );
      const data = await res.json();
      setProducts(data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (productId, file) => {
    if (!file) return;
    setUploadingId(productId);
    const token = getAccessToken();

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Upload failed");

      const updated = await res.json();
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, image_url: updated.image_url } : p))
      );
      toast.success("Product image updated!");
    } catch (err) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingId(null);
    }
  };

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Package className="text-green-700" size={24} />
            Product Images
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload and manage product images via Cloudinary
          </p>
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Current Image</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  uploadingId={uploadingId}
                  onUpload={handleImageUpload}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductRow({ product, uploadingId, onUpload }) {
  const fileRef = useRef(null);
  const isUploading = uploadingId === product.id;

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-4">
        <span className="text-sm font-semibold text-gray-900">{product.name}</span>
      </td>
      <td className="px-5 py-4">
        <span className="text-sm text-gray-500">{(product.category_names || []).join(", ") || "—"}</span>
      </td>
      <td className="px-5 py-4">
        <span className="text-sm font-medium text-gray-900">${product.price}</span>
      </td>
      <td className="px-5 py-4">
        <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon size={20} className="text-gray-300" />
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(product.id, file);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800 transition-all disabled:opacity-50 shadow-sm"
        >
          {isUploading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Upload size={15} />
          )}
          {isUploading ? "Uploading..." : product.image_url ? "Change" : "Upload"}
        </button>
      </td>
    </tr>
  );
}
