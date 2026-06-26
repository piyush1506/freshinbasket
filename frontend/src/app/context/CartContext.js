"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { getAccessToken, isAuthenticated, getUser, authFetch } from "@/lib/auth";

const CartContext = createContext();
const GUEST_CART_KEY = "guest_cart";

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [loadingItems, setLoadingItems] = useState({});
  const [storeSettings, setStoreSettings] = useState({
    free_delivery_threshold: 100,
    delivery_charge: 50,
  });
  const [backendTotals, setBackendTotals] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);

  const fetchWishlistIds = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wishlist/ids/`);
      if (res.ok) {
        setWishlistIds(await res.json());
      }
    } catch {}
  };

  const toggleWishlist = async (productId) => {
    const token = getAccessToken();
    if (!token) return;
    const isWishlisted = wishlistIds.includes(Number(productId));
    try {
      if (isWishlisted) {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wishlist/remove/`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId }),
        });
        if (res.ok) setWishlistIds((prev) => prev.filter((id) => id !== Number(productId)));
      } else {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wishlist/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product: productId }),
        });
        if (res.ok) setWishlistIds((prev) => [...prev, Number(productId)]);
      }
    } catch {}
  };

  const getCartKey = (id, subProductId) => subProductId ? `s_${id}_${subProductId}` : `p_${id}`;

  const formatCartItems = (cartData) => {
    if (!cartData || !cartData.items) return [];
    return cartData.items.map((item) => ({
      id: Number(item.product),
      name: item.name,
      price: Number(item.price),
      image_url: item.image,
      quantity: Number(item.quantity),
      unit: item.unit || 'kg',
      tax_percentage: parseFloat(item.tax_percentage) || 0,
      cartKey: getCartKey(Number(item.product), item.sub_product),
    }));
  };

  const fetchCart = async () => {
    let token = typeof window !== "undefined" ? getAccessToken() : null;
    if (!token) return;
    try {
      let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/cart/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        const { refreshAccessToken, clearAuth } = await import("@/lib/auth");
        const newToken = await refreshAccessToken();
        if (newToken) {
          token = newToken;
          res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/cart/`, {
            headers: { Authorization: `Bearer ${newToken}` },
          });
        } else {
          clearAuth();
          setUser(null);
          setCartItems([]);
          return;
        }
      }
      if (res.ok) {
        const data = await res.json();
        const cartData = Array.isArray(data) ? data[0] : data;
        setCartItems(formatCartItems(cartData));
        setBackendTotals(cartData);
      }
    } catch (e) {
      console.error("Failed to fetch cart", e);
    }
  };

  // Init once (no "isInitialized" state => avoids the ESLint cascading-render warning)
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isAuthenticated()) {
      const savedCart = localStorage.getItem(GUEST_CART_KEY);
      try {
        const parsedCart = savedCart ? JSON.parse(savedCart) : [];
        if (Array.isArray(parsedCart)) {
          queueMicrotask(() => setCartItems(parsedCart));
        }
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }

    const savedUser = getUser();
    if (savedUser) setUser(savedUser);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/store-info/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.free_delivery_threshold !== undefined) {
          setStoreSettings(data);
        }
      })
      .catch((err) => console.error("Failed to fetch store settings", err));

    // If authenticated, load cart and wishlist from backend
    fetchCart();
    fetchWishlistIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist guest cart to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isAuthenticated()) {
      localStorage.removeItem(GUEST_CART_KEY);
      return;
    }
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const mergeCart = async (token) => {
    const savedCart = localStorage.getItem(GUEST_CART_KEY);
    let guestItems = [];
    try {
      guestItems = savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.error("Failed to parse guest cart", e);
    }

    if (!Array.isArray(guestItems) || guestItems.length === 0) {
      localStorage.removeItem(GUEST_CART_KEY);
      await fetchCart();
      return;
    }

    try {
      for (const item of guestItems) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/cart/add_item/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ product_id: item.id, quantity: Number(item.quantity) || 1 })
        });
      }
      localStorage.removeItem(GUEST_CART_KEY);
      await fetchCart();
    } catch (e) {
      console.error("Failed to merge guest cart", e);
    }
  };



  const addToCart = async (product) => {
    const previousCart = cartItems;
    const quantityDelta = Number(product.quantity) || 1;
    const cartKey = getCartKey(product.id, product.subProductId);

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartKey === cartKey);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Number(updated[existingIndex].quantity) + quantityDelta;
        if (newQty <= 0) return prev.filter((_, i) => i !== existingIndex);
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      }
      if (quantityDelta <= 0) return prev;
      return [...prev, { ...product, quantity: quantityDelta, id: Number(product.id), cartKey }];
    });

    let token = typeof window !== "undefined" ? getAccessToken() : null;
    if (token) {
      setLoadingItems((prev) => ({ ...prev, [cartKey]: true }));
      try {
        let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/cart/add_item/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            product_id: product.id,
            sub_product_id: product.subProductId || null,
            quantity: quantityDelta,
          })
        });

        if (res.status === 401) {
          const { refreshAccessToken, clearAuth } = await import("@/lib/auth");
          const newToken = await refreshAccessToken();
          if (newToken) {
            res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/cart/add_item/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${newToken}`
              },
              body: JSON.stringify({
                product_id: product.id,
                sub_product_id: product.subProductId || null,
                quantity: quantityDelta,
              })
            });
          } else {
            clearAuth();
            setUser(null);
            return;
          }
        }

        if (res.ok) {
          const updatedCartData = await res.json();
          setCartItems(formatCartItems(updatedCartData));
          setBackendTotals(updatedCartData);
        } else {
          console.error("Server cart update failed", res.status);
          setCartItems(previousCart);
        }
      } catch (e) {
        console.error("Failed to add item", e);
        setCartItems(previousCart);
      } finally {
        setLoadingItems((prev) => ({ ...prev, [cartKey]: false }));
      }
    }
  };

  const removeFromCart = async (id, subProductId) => {
    const cartKey = getCartKey(id, subProductId);
    const previousCart = cartItems;
    setCartItems((prev) => prev.filter((item) => item.cartKey !== cartKey));

    let token = typeof window !== "undefined" ? getAccessToken() : null;
    if (token) {
      try {
        let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/cart/remove_item/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ product_id: id, sub_product_id: subProductId || null })
        });

        if (res.status === 401) {
          const { refreshAccessToken, clearAuth } = await import("@/lib/auth");
          const newToken = await refreshAccessToken();
          if (newToken) {
            res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/cart/remove_item/`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${newToken}`
              },
              body: JSON.stringify({ product_id: id, sub_product_id: subProductId || null })
            });
          } else {
            clearAuth();
            setUser(null);
            return;
          }
        }

        if (res.ok) {
          const updatedCartData = await res.json();
          setCartItems(formatCartItems(updatedCartData));
          setBackendTotals(updatedCartData);
        } else {
          setCartItems(previousCart);
        }
      } catch (e) {
        console.error("Failed to remove item", e);
        setCartItems(previousCart);
      }
    }
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  // Calculate locally for guest users, use backend values for logged in users if available
  const subtotal = backendTotals?.subtotal !== undefined 
      ? parseFloat(backendTotals.subtotal) 
      : cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
  const freeDeliveryThreshold = backendTotals?.free_delivery_threshold !== undefined
      ? parseFloat(backendTotals.free_delivery_threshold)
      : parseFloat(storeSettings?.free_delivery_threshold) || 100;
      
  const deliveryChargeValue = parseFloat(storeSettings?.delivery_charge) || 50;
  
  const deliveryCharge = backendTotals?.delivery_charge !== undefined
      ? parseFloat(backendTotals.delivery_charge)
      : ((subtotal > 0 && subtotal <= freeDeliveryThreshold) ? deliveryChargeValue : 0);
      
  const taxAmount = cartItems.reduce((sum, item) => {
    const pct = Number(item.tax_percentage) || 0;
    return sum + (item.price * item.quantity * pct / 100);
  }, 0);

  const hasTaxableItems = cartItems.some((item) => Number(item.tax_percentage) > 0);

  const grandTotal = backendTotals?.grand_total !== undefined
      ? parseFloat(backendTotals.grand_total)
      : subtotal + taxAmount + deliveryCharge;

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, clearCart, cartCount,
      loadingItems, mergeCart, user, setUser, storeSettings,
      subtotal, deliveryCharge, grandTotal, freeDeliveryThreshold,
      taxAmount, hasTaxableItems,
      wishlistIds, toggleWishlist, fetchWishlistIds
    }}>
      <Toaster position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1a1a1a',
            borderRadius: '10px',
            fontSize: '14px'
          },
          success: {
            iconTheme: { primary: '#484d4aff', secondary: '#fff' }
          }
        }} />
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
