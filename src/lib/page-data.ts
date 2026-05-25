import { Boxes, ChartNoAxesColumnIncreasing, CreditCard, Headphones, Heart, Home, Image, LayoutDashboard, LockKeyhole, Package, Percent, Settings, ShieldCheck, Truck, UserRound, UsersRound } from "lucide-react";

export const publicRoutes = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/cart", label: "Cart" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/support", label: "Support" }
];

export const accountRoutes = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/checkout", label: "Checkout" }
];

export const adminRoutes = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/products/new", label: "New Product", icon: Boxes },
  { href: "/admin/orders", label: "Orders", icon: CreditCard },
  { href: "/admin/coupons", label: "Coupons", icon: Percent },
  { href: "/admin/homepage", label: "Homepage", icon: Home },
  { href: "/admin/media", label: "Media", icon: Image },
  { href: "/admin/reviews", label: "Reviews", icon: ChartNoAxesColumnIncreasing },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/staff", label: "Staff", icon: UsersRound },
  { href: "/admin/support", label: "Support", icon: Headphones }
];

export const policyCopy = {
  "privacy-policy": {
    title: "Privacy Policy",
    kicker: "Customer data, handled with restraint.",
    body: ["We collect only the information needed to run orders, accounts, support, and store security.", "Authentication tokens are kept out of browser JavaScript through HttpOnly cookies in this Next.js shell.", "Newsletter and support messages should be treated as private customer records."]
  },
  "terms-and-conditions": {
    title: "Terms & Conditions",
    kicker: "Clear rules for buying from Werd.",
    body: ["Orders depend on stock availability, successful payment confirmation, and valid delivery details.", "Promotions, coupons, and shipping rules are confirmed during checkout before an order is fulfilled.", "Returns and cancellations should be handled through support or account order tools."]
  },
  terms: {
    title: "Terms",
    kicker: "The short version.",
    body: ["Use the site fairly, keep your account secure, and contact support when an order needs human attention.", "Checkout and payment state are confirmed server-side before fulfillment."]
  }
};

export const secureFeatures = [
  { title: "Secure Sign-In", text: "Keep your account protected while you shop, save favorites, and review orders.", icon: LockKeyhole },
  { title: "Protected Activity", text: "Sensitive account actions are guarded so checkout stays calm and reliable.", icon: ShieldCheck },
  { title: "Flexible Payment", text: "Choose the available payment method that fits your delivery and order.", icon: CreditCard },
  { title: "Saved Favorites", text: "Collect the pieces you want to revisit before the next drop moves.", icon: Heart }
];
