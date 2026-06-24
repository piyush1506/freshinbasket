"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import VegetableCard from "../../components/VegetableCard";
import { useCart } from "../../context/CartContext";
import { ArrowLeft, Minus, Plus, ShoppingCart, Leaf, Heart } from "lucide-react";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, removeFromCart, cartItems, wishlistIds, toggleWishlist, user } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const cartItem = cartItems.find((c) => Number(c.id) === Number(id));
  const cartQty = cartItem ? Number(cartItem.quantity) : 0;

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${id}/`);
        if (!res.ok) { router.push("/"); return; }
        const data = await res.json();
        setProduct(data);
        setQty(Math.max(1, cartQty));

        const allRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/`);
        const allData = await allRes.json();
        const sameCategory = allData.filter(
          (p) => {
            if (Number(p.id) === Number(id)) return false;
            const pCats = p.category_names || [];
            const prodCats = data.category_names || [];
            return pCats.some((c) => prodCats.includes(c));
          }
        );
        setRelated(sameCategory.slice(0, 8));
      } catch (e) {
        console.error(e);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (cartQty > 0 && qty === 0) setQty(cartQty);
  }, [cartQty]);

  const handleAddToCart = async () => {
    if (adding || !product) return;
    setAdding(true);
    try {
      if (qty === 0) {
        await removeFromCart(product.id);
        toast.success("Removed from cart");
      } else {
        const delta = cartQty > 0 ? qty - cartQty : qty;
        await addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          quantity: delta,
          unit: product.unit?.name || 'kg',
        });
        toast.success(cartQty > 0 ? "Cart updated!" : "Added to cart!");
      }
    } catch (e) {
      toast.error("Could not update cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-700 border-t-transparent" />
        </div>
      </>
    );
  }

  if (!product) return null;

  const firstCategory = product.category_names?.[0];

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft size={20} /> Back
        </button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
            <Image
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {product.category_names?.map((cat) => (
                <Link key={cat} href={`/category/${cat.toLowerCase()}`} className="text-sm font-semibold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1 rounded-full">
                  {cat}
                </Link>
              ))}
              {product.stock <= 0 ? (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">Out of Stock</span>
              ) : (
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">In Stock</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 capitalize mb-2">{product.name}</h1>
            <p className="text-gray-500 text-sm mb-1 flex items-center gap-1.5">
              <Leaf size={14} className="text-green-600" /> Fresh & Organic
            </p>

            <div className="my-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold text-green-700">
                  ₹{Number(product.price).toFixed(2)}
                </span>
                {Number(product.mrp) > Number(product.price) && (
                  <>
                    <span className="text-xl text-gray-400 line-through font-semibold">
                      ₹{Number(product.mrp).toFixed(2)}
                    </span>
                    {Number(product.discount_percentage) > 0 && (
                      <span className="bg-[#2470f1] text-white text-xs font-bold px-2 py-1 rounded-md">
                        {product.discount_percentage}% OFF
                      </span>
                    )}
                  </>
                )}
              </div>
              <span className="text-lg font-semibold text-gray-400">/{product.unit?.name || 'kg'}</span>
            </div>

            {Number(product.tax_percentage) > 0 && (
              <p className="text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg mb-4 inline-block font-medium">
                +{Number(product.tax_percentage)}% tax applicable
              </p>
            )}

            <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-semibold text-gray-700">Quantity:</span>
              <div className="flex items-center bg-gray-100 rounded-xl">
                <button
                  onClick={() => setQty(Math.max(0, qty - 1))}
                  disabled={qty <= 0}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-green-700 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-40"
                >
                  <Minus size={18} />
                </button>
                <input
                  type="number"
                  min="0"
                  value={qty}
                  onChange={(e) => setQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-14 text-center text-lg font-bold bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-green-700 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || adding}
                className="flex-1 sm:flex-none bg-green-700 text-white px-8 py-3.5 rounded-xl text-base font-extrabold hover:bg-green-800 transition-colors flex items-center justify-center gap-2 disabled:bg-green-400 disabled:cursor-not-allowed shadow-lg shadow-green-700/20"
              >
                <ShoppingCart size={20} />
                {adding ? "Updating..." : cartQty > 0 ? "Update Cart" : "Add to Cart"}
              </button>
              {user && (
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="p-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Heart
                    size={22}
                    className={wishlistIds?.includes(Number(product.id)) ? "fill-red-500 text-red-500" : "text-gray-500"}
                  />
                </button>
              )}
            </div>

            {cartQty > 0 && (
              <p className="text-sm text-gray-500 mt-3">
                {cartQty} kg in cart — <button onClick={() => { removeFromCart(product.id); toast.success("Removed from cart"); }} className="text-red-500 hover:underline font-semibold">Remove</button>
              </p>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
              {firstCategory && (
                <Link href={`/category/${firstCategory.toLowerCase()}`} className="text-sm font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
                  View All <span className="text-lg">→</span>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {related.map((item) => (
                <VegetableCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
