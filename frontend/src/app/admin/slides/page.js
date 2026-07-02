"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Plus,
  Loader2,
  Trash2,
  GripVertical,
  ArrowLeft,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import { getAccessToken, getUser } from "@/lib/auth";
import toast from "react-hot-toast";

export default function AdminSlidesPage() {
  const router = useRouter();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    tag: "Organic",
    link: "",
    button_text: "Shop Now",
    link_two: "",
    button_text_two: "View Offers",
    order: 0,
    is_active: true,
    image_url: "",
    imageFile: null,
  });
  const [preview, setPreview] = useState(null);

  const fetchSlides = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/slides/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSlides(data);
    } catch {
      toast.error("Failed to load slides");
    } finally {
      setLoading(false);
    }
  };

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
    fetchSlides();
  }, []);

  const resetForm = () => {
    setForm({ title: "", subtitle: "", tag: "Organic", link: "", button_text: "Shop Now", link_two: "", button_text_two: "View Offers", order: 0, is_active: true, image_url: "", imageFile: null });
    setPreview(null);
    setEditingId(null);
    setShowForm(false);
  };

  const editSlide = (slide) => {
    setForm({
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      tag: slide.tag || "Organic",
      link: slide.link || "",
      button_text: slide.button_text || "Shop Now",
      link_two: slide.link_two || "",
      button_text_two: slide.button_text_two || "View Offers",
      order: slide.order,
      is_active: slide.is_active,
      image_url: slide.image_url || "",
      imageFile: null,
    });
    setPreview(slide.image_url || null);
    setEditingId(slide.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.image_url && !form.imageFile && !editingId) {
      toast.error("Please enter an image URL or upload an image");
      return;
    }
    setSaving(true);
    try {
      const token = getAccessToken();
      let body;
      let headers = { Authorization: `Bearer ${token}` };

      if (form.imageFile) {
        body = new FormData();
        Object.keys(form).forEach(key => {
          if (key === 'imageFile' && form[key]) {
            body.append('image', form[key]);
          } else if (key !== 'imageFile' && form[key] !== null && form[key] !== undefined) {
            body.append(key, form[key]);
          }
        });
      } else {
        body = JSON.stringify({
          title: form.title,
          subtitle: form.subtitle,
          tag: form.tag,
          link: form.link,
          button_text: form.button_text,
          link_two: form.link_two,
          button_text_two: form.button_text_two,
          order: form.order,
          is_active: form.is_active,
          image_url: form.image_url,
        });
        headers["Content-Type"] = "application/json";
      }

      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/slides/${editingId}/`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/slides/`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(Object.values(err).flat().join(", "));
      }

      toast.success(editingId ? "Slide updated" : "Slide created");
      resetForm();
      fetchSlides();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSlide = async (id) => {
    if (!confirm("Delete this slide?")) return;
    try {
      const token = getAccessToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/slides/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Slide deleted");
      fetchSlides();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleActive = async (slide) => {
    try {
      const token = getAccessToken();
      const body = { is_active: !slide.is_active };
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/slides/${slide.id}/`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
      });
      fetchSlides();
    } catch {
      toast.error("Failed to update");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Hero Slides</h1>
              <p className="text-sm text-gray-500 mt-1">Manage homepage slider banners</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white rounded-xl font-semibold hover:bg-green-800 transition-colors"
          >
            <Plus size={18} />
            Add Slide
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {editingId ? "Edit Slide" : "New Slide"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Slide heading"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subtitle</label>
                  <textarea
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    placeholder="Slide description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tag / Badge</label>
                  <input
                    type="text"
                    value={form.tag}
                    onChange={(e) => setForm({ ...form, tag: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Organic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Button 1 Text</label>
                  <input
                    type="text"
                    value={form.button_text}
                    onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Button 1 Link</label>
                  <input
                    type="text"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="/category/vegetables"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Button 2 Text</label>
                  <input
                    type="text"
                    value={form.button_text_two}
                    onChange={(e) => setForm({ ...form, button_text_two: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="View Offers"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Button 2 Link (optional)</label>
                  <input
                    type="text"
                    value={form.link_two}
                    onChange={(e) => setForm({ ...form, link_two: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="/offers"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Order</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-green-700 focus:ring-green-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Active</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image</label>
                  <input
                    type="text"
                    value={form.image_url}
                    onChange={(e) => {
                      setForm({ ...form, image_url: e.target.value, imageFile: null });
                      setPreview(e.target.value);
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none mb-3"
                    placeholder="https://example.com/image.jpg"
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">OR</span>
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 transition-colors flex items-center gap-2">
                      <ImageIcon size={16} />
                      Upload Image
                      <input
                        type="file"
                        ref={fileRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setForm({ ...form, imageFile: file, image_url: "" });
                            setPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                  {preview && (
                    <img
                      src={preview}
                      alt="Preview"
                      className="mt-3 h-32 w-full object-cover rounded-xl border border-gray-200"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-700 text-white rounded-xl font-semibold hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingId ? "Update" : "Create"}
              </button>
              <button
                onClick={resetForm}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Slides List */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {slides.length === 0 ? (
            <div className="p-12 text-center">
              <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No slides yet</p>
              <p className="text-gray-400 text-sm mt-1">Click "Add Slide" to create your first hero banner</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="shrink-0 text-gray-300 cursor-grab">
                    <GripVertical size={18} />
                  </div>
                  <div className="w-28 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    {slide.image_url ? (
                      <img
                        src={slide.image_url}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={20} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {slide.title || "Untitled"}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {slide.subtitle || "No description"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400 font-mono">#{slide.order}</span>
                    <button
                      onClick={() => toggleActive(slide)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        slide.is_active
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-300 hover:bg-gray-100"
                      }`}
                      title={slide.is_active ? "Active" : "Inactive"}
                    >
                      {slide.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      onClick={() => editSlide(slide)}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteSlide(slide.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
