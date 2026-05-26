"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Menu, Search, ShoppingBag, SlidersHorizontal, UserRound, X } from "lucide-react";
import type { HomepageConfig, Product } from "@/lib/types";
import { AddToCartButton, useCart } from "@/components/cart-provider";
import { useAuthStatus } from "@/components/auth-status";

type StorefrontProps = {
  products: Product[];
  featured: Product[];
  homepage?: HomepageConfig | null;
};

const categories = ["All", "Jackets", "Glasses", "Pants", "Handbags", "T-Shirt", "Shoes"];
const brands = ["Nike", "Erigo", "Zara", "Adidas", "Puma", "NB"];
const heroSlides = [
  {
    label: "Limited drop, online first",
    title: "New Collection",
    copy: "Elevate your wardrobe with our exclusive collection",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=86"
  },
  {
    label: "Street heat, clean layers",
    title: "Urban Uniform",
    copy: "Sharp outerwear, washed neutrals, and all-day sneakers",
    image: "https://images.unsplash.com/photo-1506629905607-d9f297d33b64?auto=format&fit=crop&w=1800&q=86"
  },
  {
    label: "Accessories in rotation",
    title: "Brand New",
    copy: "Glasses, bags, and signature pieces for the next fit",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=86"
  }
];

const defaultTicker = ["Limited time offer", "Get 25% off your next fashion adventure", "Accessories galore", "Free shipping on orders over $50", "Career gear and everyday essentials"];
const fallbackFeaturedCards = [
  {
    title: "Editorial Selects",
    category: "new-arrivals",
    imageUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85",
    bg: "linear-gradient(145deg, #171717, #3f3f3f)"
  },
  {
    title: "Complete The Fit",
    category: "shop",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
    bg: "linear-gradient(145deg, #202020, #555555)"
  },
  {
    title: "Fresh Accessories",
    category: "accessories",
    imageUrl: "https://images.unsplash.com/photo-1506629905607-d9f297d33b64?auto=format&fit=crop&w=900&q=85",
    bg: "linear-gradient(145deg, #2c2c2c, #6a6a6a)"
  }
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value || 0);
}

function getCategoryHref(category?: string, fallback = "/shop") {
  if (!category) return fallback;
  const normalized = category.trim().toLowerCase();
  if (!normalized) return fallback;
  return normalized === "shop" ? "/shop" : `/shop/${encodeURIComponent(normalized)}`;
}

function productWithPreferredSize(product: Product, user: { sizePreferences?: { top?: string; bottom?: string; shoe?: string; color?: string } } | null) {
  const category = product.category.toLowerCase();
  const preferred = category.includes("shoe")
    ? user?.sizePreferences?.shoe
    : category.includes("pant") || category.includes("bottom")
      ? user?.sizePreferences?.bottom
      : user?.sizePreferences?.top;
  const preferredColor = user?.sizePreferences?.color;

  return {
    ...product,
    size: preferred && (!product.sizes?.length || product.sizes.includes(preferred)) ? preferred : product.size,
    color: preferredColor && (!product.colors?.length || product.colors.includes(preferredColor)) ? preferredColor : product.color
  };
}

export function Storefront({ products, featured, homepage }: StorefrontProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [navShrunk, setNavShrunk] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [activeHero, setActiveHero] = useState(0);
  const [activeFit, setActiveFit] = useState(0);
  const heroSwipeStart = useRef<number | null>(null);
  const fitSwipeStart = useRef<number | null>(null);
  const productCarouselRef = useRef<HTMLDivElement | null>(null);
  const productCarouselPaused = useRef(false);
  const { itemCount, openCart } = useCart();
  const { user, isAuthenticated } = useAuthStatus();
  const accountHref = user?.role === "admin" ? "/admin" : isAuthenticated ? "/account" : "/login";
  const accountLabel = user?.role === "admin" ? "Admin" : isAuthenticated ? "Account" : "Login";
  const resolvedHeroSlides = useMemo(() => {
    const slides = homepage?.heroSlides?.length
      ? homepage.heroSlides.map((slide) => ({
          label: slide.tagline || "Limited drop, online first",
          title: slide.title || "New Collection",
          copy: slide.category ? `Shop the ${slide.category} edit now` : "Elevate your wardrobe with our exclusive collection",
          ctaLabel: slide.ctaLabel || "Discover Collection",
          ctaLink: slide.ctaLink || "/shop",
          image: slide.imageUrl || "",
          bg: slide.bgColor || ""
        }))
      : heroSlides.map((slide) => ({ ...slide, ctaLabel: "Discover Collection", ctaLink: "/shop", bg: "" }));
    return slides.length ? slides : heroSlides.map((slide) => ({ ...slide, ctaLabel: "Discover Collection", ctaLink: "/shop", bg: "" }));
  }, [homepage]);
  const activeSlide = resolvedHeroSlides[activeHero] || resolvedHeroSlides[0];
  const tickerItems = useMemo(() => {
    if (homepage && !homepage.tickerVisible) return [];
    const items = (homepage?.tickerText || "")
      .replaceAll("âœ¦", "✦")
      .replaceAll("â€¢", "•")
      .split(/[✦•|]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);
    return items.length ? items : defaultTicker;
  }, [homepage]);
  const sectionOrder = useMemo(() => {
    const saved = homepage?.sectionOrder?.length ? homepage.sectionOrder : ["ticker", "cards", "collection", "banner"];
    return [...saved, ...["buy-fit", "products"].filter((key) => !saved.includes(key))];
  }, [homepage]);
  const customSectionsMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof homepage>["customSections"] extends Array<infer T> | undefined ? T : never>();
    (homepage?.customSections || []).forEach((s) => map.set(s.id, s));
    return map;
  }, [homepage]);
  const buyTheFits = useMemo(() => {
    const configured = (homepage?.buyTheFits || []).filter((fit) => {
      if (fit.visible === false) return false;
      const hasProducts = Boolean(fit.productSlugs?.length);
      const hasCustomModel = Boolean(fit.modelImage);
      const hasCustomCopy = Boolean(fit.title && fit.title !== "BUY THE FIT") || Boolean(fit.copy && fit.copy !== "Tap any piece around the model to build the full look.");
      return fit.id !== "fit_default" || hasProducts || hasCustomModel || hasCustomCopy;
    });
    if (homepage && Array.isArray(homepage.buyTheFits)) return configured;
    return configured.length ? configured : [{
      id: "default-fit",
      kicker: "Styled together",
      title: "Buy The Fit",
      copy: "Tap any piece around the model to build the full look.",
      modelImage: homepage?.banner?.imageUrlLeft || "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85",
      ctaLabel: "Shop The Fit",
      ctaLink: "/shop",
      productSlugs: featured.slice(0, 4).map((item) => item.slug)
    }];
  }, [featured, homepage]);
  const featuredCards = useMemo(() => {
    const configured = homepage?.featuredCards?.filter((card) => card.title || card.imageUrl || card.category) || [];
    return configured.length ? configured : fallbackFeaturedCards;
  }, [homepage]);
  const activeFitSlide = buyTheFits[activeFit] || buyTheFits[0];
  const fitProducts = useMemo(() => {
    const wanted = new Set((activeFitSlide?.productSlugs || []).map((item) => item.toLowerCase()));
    const chosen = wanted.size
      ? products.filter((product) => wanted.has(product.slug.toLowerCase()) || wanted.has(product.id.toLowerCase()) || (product.productId && wanted.has(product.productId.toLowerCase())))
      : [];
    const merged = [...chosen, ...featured].filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index);
    return merged.slice(0, 8);
  }, [activeFitSlide, featured, products]);
  const fitShopHref = useMemo(() => {
    const selected = (activeFitSlide?.productSlugs || []).filter(Boolean);
    if (!selected.length) return activeFitSlide?.ctaLink || "/shop";
    return `/shop?fit=${encodeURIComponent(selected.join(","))}`;
  }, [activeFitSlide]);

  function moveHero(direction: number) {
    if (resolvedHeroSlides.length <= 1) return;
    setActiveHero((index) => (index + direction + resolvedHeroSlides.length) % resolvedHeroSlides.length);
  }

  function moveFit(direction: number) {
    if (buyTheFits.length <= 1) return;
    setActiveFit((index) => (index + direction + buyTheFits.length) % buyTheFits.length);
  }

  function finishSwipe(start: number | null, end: number, move: (direction: number) => void) {
    if (start == null) return;
    const delta = end - start;
    if (Math.abs(delta) < 48) return;
    move(delta < 0 ? 1 : -1);
  }

  function scrollProducts(direction: number) {
    const carousel = productCarouselRef.current;
    if (!carousel) return;
    carousel.scrollBy({
      left: direction * Math.min(carousel.clientWidth * 0.82, 560),
      behavior: "smooth"
    });
  }

  useEffect(() => {
    let lastY = window.scrollY;

    function onScroll() {
      const currentY = window.scrollY;
      const scrollingDown = currentY > lastY + 5;
      const scrollingUp = currentY < lastY - 5;

      if (currentY < 70 || scrollingUp) setNavShrunk(false);
      if (currentY > 120 && scrollingDown) setNavShrunk(true);
      lastY = Math.max(currentY, 0);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveHero((index) => (index + 1) % resolvedHeroSlides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [resolvedHeroSlides.length]);

  useEffect(() => {
    if (activeHero >= resolvedHeroSlides.length) setActiveHero(0);
  }, [activeHero, resolvedHeroSlides.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveFit((index) => (index + 1) % buyTheFits.length);
    }, 6800);

    return () => window.clearInterval(timer);
  }, [buyTheFits.length]);

  useEffect(() => {
    if (activeFit >= buyTheFits.length) setActiveFit(0);
  }, [activeFit, buyTheFits.length]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = category === "All" || product.category.toLowerCase().includes(category.toLowerCase());
      const matchesQuery = !normalizedQuery || [product.name, product.category, product.description].join(" ").toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const carousel = productCarouselRef.current;
      if (!carousel || productCarouselPaused.current || visibleProducts.length <= 3) return;

      const nearEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 12;
      if (nearEnd) {
        carousel.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      const card = carousel.querySelector<HTMLElement>(".product-card");
      carousel.scrollBy({
        left: card ? card.offsetWidth + 18 : Math.min(carousel.clientWidth * 0.82, 560),
        behavior: "smooth"
      });
    }, 3200);

    return () => window.clearInterval(timer);
  }, [visibleProducts.length]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password")
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setAuthMessage("You are signed in securely.");
        window.location.assign(payload.user?.role === "admin" ? "/admin" : "/");
        return;
      }
      setAuthMessage(payload.message || payload.error || "Login failed.");
    });
  }

  async function handleNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNewsletterMessage("");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") })
    });

    const payload = await response.json().catch(() => ({}));
    setNewsletterMessage(response.ok ? "You are on the list." : payload.message || "Could not subscribe.");
  }

  return (
    <main className="site-shell">
      <header className="header">
        <nav className="nav-strip" aria-label="Primary navigation">
          <button className="icon-button mobile-only" type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <div className="nav-links">
            <a href="/shop">Shop</a>
            <a href="/shop/streetwear">Collections</a>
            <a href="#sale">Sale</a>
            <a href="/shop">New Arrivals</a>
          </div>
          <a className="brand-mark" href="/" aria-label="Werd home">
            Werd
          </a>
          <div className="nav-actions">
            <a href="/shop/men">Men</a>
            <a href="/shop/woman">Woman</a>
            <a href="/shop/kids">Kids</a>
            <a className="icon-button" href="/wishlist" aria-label="Wishlist">
              <Heart size={16} />
            </a>
            <button className="icon-button cart-button" type="button" onClick={openCart} aria-label={`${itemCount} items in cart`}>
              <ShoppingBag size={16} />
              {itemCount > 0 && <span>{itemCount}</span>}
            </button>
            <button className="login-button" type="button" onClick={() => setAuthOpen(true)}>
              Login
            </button>
          </div>
        </nav>

        <div className="search-row">
          <label className="search-box">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Nike Men's Free RN 2018 Running Shoe..." />
          </label>
          <button className="filter-button" type="button" aria-label="Open filters">
            Filter <SlidersHorizontal size={15} />
          </button>
        </div>
      </header>

      <nav className={`floating-nav visible ${navShrunk && !menuOpen ? "scrolled" : ""}`} aria-label="Floating navigation" onPointerDown={() => setNavShrunk(false)}>
        <div className="dock-actions">
          <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close menu" : "Open menu"}>
            <Menu size={16} />
          </button>
        </div>
        <a href="/shop">Shop</a>
        <a href="/shop/streetwear">
          <span className="dock-label-full">Collections</span>
          <span className="dock-label-short">Drops</span>
        </a>
        <a className="floating-brand" href="/" aria-label="Werd home">
          Werd
        </a>
        <a href="/shop">New</a>
        <a href={accountHref}>{accountLabel}</a>
        <button className="floating-cart-action cart-button" type="button" onClick={openCart} aria-label={`${itemCount} items in cart`}>
          <ShoppingBag size={16} />
          {itemCount > 0 && <span>{itemCount}</span>}
        </button>
      </nav>

      <section
        className="hero moving-hero"
        aria-labelledby="hero-title"
        style={{ backgroundImage: activeSlide.image ? `url("${activeSlide.image}")` : activeSlide.bg }}
        onPointerDown={(event) => { heroSwipeStart.current = event.clientX; }}
        onPointerUp={(event) => { finishSwipe(heroSwipeStart.current, event.clientX, moveHero); heroSwipeStart.current = null; }}
        onPointerCancel={() => { heroSwipeStart.current = null; }}
      >
        <div className="hero-shade" />
        <div className="hero-word">SUPERB</div>
        <div className="spark spark-one" />
        <div className="loop-mark loop-one" />
        <div className="carousel-arrows hero-arrows" aria-label="Hero carousel controls">
          <button type="button" onClick={() => moveHero(-1)} disabled={resolvedHeroSlides.length <= 1} aria-label="Previous hero slide">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => moveHero(1)} disabled={resolvedHeroSlides.length <= 1} aria-label="Next hero slide">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="hero-content">
          <p>{activeSlide.label}</p>
          <h1 id="hero-title">{activeSlide.title}</h1>
          <span>{activeSlide.copy}</span>
          <a className="pill-link" href={activeSlide.ctaLink}>
            {activeSlide.ctaLabel} <ArrowRight size={16} />
          </a>
          <div className="hero-dots" aria-label="Hero slides">
            {resolvedHeroSlides.map((slide, index) => (
              <button
                className={index === activeHero ? "active" : ""}
                type="button"
                key={`${slide.title || "hero"}-${slide.image || slide.bg || index}-${index}`}
                onClick={() => setActiveHero(index)}
                aria-label={`Show ${slide.title}`}
              />
            ))}
          </div>
        </div>
      </section>

      {sectionOrder.map((sectionId) => {
        if (sectionId === "ticker") {
          return tickerItems.length > 0 ? (
            <div className="ticker" role="presentation" key="ticker">
              {tickerItems.map((item) => <span key={item}>{item}</span>)}
            </div>
          ) : null;
        }
        if (sectionId === "collection") return (
          <section className="brand-band" id="collections" key="collection">
            <div>
              <h2>{homepage?.collectionTitle || "Fashion Forward"}</h2>
              <p>{homepage?.collectionSubtext || "Style Eternal"}</p>
            </div>
            <div className="brand-logos" aria-label="Featured brands">
              {brands.map((brand) => <span key={brand}>{brand}</span>)}
            </div>
          </section>
        );
        if (sectionId === "cards") return (
          <section className="editorial-grid" aria-label="Featured collection" key="cards">
            <article className="large-feature">
              <img src={featuredCards[0]?.imageUrl || fallbackFeaturedCards[0].imageUrl} alt={featuredCards[0]?.title || "Featured editorial selection"} />
              <div className="loop-mark" />
              <a href={getCategoryHref(featuredCards[0]?.category, "#new")}>{featuredCards[0]?.title || "See More"}</a>
            </article>
            <div className="mini-feature-row">
              {featuredCards.slice(1, 3).map((card, index) => (
                <a className="mini-feature" href={getCategoryHref(card.category, featured[index] ? `/product/${featured[index].slug}` : "/shop")} key={`${card.title || "card"}-${index}`}>
                  <img src={card.imageUrl || featured[index]?.image || fallbackFeaturedCards[index + 1]?.imageUrl} alt={card.title || featured[index]?.name || "Featured story"} />
                  <div>
                    <h3>{card.title || featured[index]?.name || "Featured Story"}</h3>
                    <p>{card.category || featured[index]?.category || "Shop now"}</p>
                  </div>
                  <ArrowRight size={16} />
                </a>
              ))}
            </div>
          </section>
        );
        if (sectionId === "buy-fit") return buyTheFits.length > 0 ? (
          <section
            key="buy-fit"
            className={`buy-fit-section ${fitProducts.length > 4 ? "orbit-fit" : ""}`}
            aria-labelledby="buy-fit-title"
            onPointerDown={(event) => { fitSwipeStart.current = event.clientX; }}
            onPointerUp={(event) => { finishSwipe(fitSwipeStart.current, event.clientX, moveFit); fitSwipeStart.current = null; }}
            onPointerCancel={() => { fitSwipeStart.current = null; }}
          >
            <div className="buy-fit-copy">
              <p>{activeFitSlide.kicker || "Styled together"}</p>
              <h2 id="buy-fit-title">{activeFitSlide.title || "Buy The Fit"}</h2>
              <span>{activeFitSlide.copy || "Tap any piece around the model to build the full look."}</span>
              <a className="fit-cta" href={fitShopHref}>{activeFitSlide.ctaLabel || "Shop The Fit"} <ArrowRight size={15} /></a>
              {buyTheFits.length > 1 && <div className="hero-dots fit-dots" aria-label="Buy the fit slides">
                {buyTheFits.map((fit, index) => (
                  <button className={index === activeFit ? "active" : ""} type="button" key={fit.id} onClick={() => setActiveFit(index)} aria-label={`Show ${fit.title || `fit ${index + 1}`}`} />
                ))}
              </div>}
            </div>
            <div className="carousel-arrows fit-arrows" aria-label="Buy the fit carousel controls">
              <button type="button" onClick={() => moveFit(-1)} disabled={buyTheFits.length <= 1} aria-label="Previous fit slide"><ChevronLeft size={18} /></button>
              <button type="button" onClick={() => moveFit(1)} disabled={buyTheFits.length <= 1} aria-label="Next fit slide"><ChevronRight size={18} /></button>
            </div>
            <div className="buy-fit-stage">
              <img className="buy-fit-model" src={activeFitSlide.modelImage || homepage?.banner?.imageUrlLeft || "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85"} alt="Model wearing a complete Werd outfit" />
              {fitProducts.slice(0, 8).map((item, index) => (
                <a className={`fit-product fit-product-${index + 1}`} href={`/product/${item.slug}`} key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <span>{item.name}</span>
                  <strong>{formatCurrency(item.price)}</strong>
                </a>
              ))}
            </div>
          </section>
        ) : null;
        if (sectionId === "products") return (
          <section className="products-section" id="new" key="products">
            <div className="section-heading">
              <h2>New Arrivals</h2>
              <div className="category-tabs" role="tablist" aria-label="Product categories">
                {categories.map((item) => (
                  <button className={item === category ? "active" : ""} type="button" key={item} onClick={() => setCategory(item)}>{item}</button>
                ))}
              </div>
              <div className="product-carousel-controls" aria-label="Product carousel controls">
                <button type="button" onClick={() => scrollProducts(-1)} aria-label="Scroll products left"><ChevronLeft size={16} /></button>
                <button type="button" onClick={() => scrollProducts(1)} aria-label="Scroll products right"><ChevronRight size={16} /></button>
              </div>
            </div>
            <div
              className="product-grid product-carousel"
              ref={productCarouselRef}
              onPointerEnter={() => { productCarouselPaused.current = true; }}
              onPointerLeave={() => { productCarouselPaused.current = false; }}
              onFocus={() => { productCarouselPaused.current = true; }}
              onBlur={() => { productCarouselPaused.current = false; }}
            >
              {visibleProducts.map((product, index) => (
                <article className={`product-card ${index === 5 ? "buy-card" : ""}`} key={product.id}>
                  <div className="product-image">
                    <img src={product.image} alt={product.name} loading="lazy" />
                    {index === 5 && <span className="buy-now">Buy Now</span>}
                  </div>
                  <span className="product-badge">{product.badge || product.category}</span>
                  <h3>{product.name}</h3>
                  {product.description && <p className="product-desc">{product.description}</p>}
                  <div className="product-footer">
                    <strong>{formatCurrency(product.price)}</strong>
                    <AddToCartButton product={productWithPreferredSize(product, user)} ariaLabel={`Quick add ${product.name} to cart`}>
                      <ShoppingBag size={16} />
                      <span>Quick Add</span>
                    </AddToCartButton>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
        if (sectionId === "banner") return (
          <section className="fantasy" id="sale" key="banner">
            <div className="fantasy-heading">
              <h2>{homepage?.banner?.heading || "Unleash Your Fashion Fantasy"}</h2>
              <a className="dark-pill" href={homepage?.banner?.ctaLink || "/shop"}>
                {homepage?.banner?.ctaLabel || "Discover Collection"} <ArrowRight size={16} />
              </a>
            </div>
            <div className="campaign-grid">
              <article>
                <img src="https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1100&q=85" alt="Streetwear campaign shirt" />
                <div>
                  <p>Long-Sleeve T-Shirt</p>
                  <button type="button">Shop Now <ArrowRight size={14} /></button>
                </div>
              </article>
              <article>
                <img src="https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1100&q=85" alt="New sneakers on city pavement" />
                <div>
                  <p>Urban Sneaker 2026</p>
                  <button type="button">Shop Now <ArrowRight size={14} /></button>
                </div>
              </article>
            </div>
          </section>
        );
        if (sectionId.startsWith("custom_")) {
          const cs = customSectionsMap.get(sectionId);
          if (!cs || cs.visible === false) return null;
          if (cs.type === "text") return (
            <div className="custom-text-section" key={sectionId}>
              {cs.heading && <h2>{cs.heading}</h2>}
              {cs.body && <p>{cs.body}</p>}
            </div>
          );
          if (cs.type === "image_text") return (
            <div className="custom-image-text-section" key={sectionId}>
              {cs.imageUrl && <img src={cs.imageUrl} alt={cs.heading || ""} />}
              <div className="custom-it-copy">
                {cs.heading && <h2>{cs.heading}</h2>}
                {cs.body && <p>{cs.body}</p>}
                {cs.ctaLabel && cs.ctaLink && <a href={cs.ctaLink}>{cs.ctaLabel}</a>}
              </div>
            </div>
          );
          if (cs.type === "cta") return (
            <div className="custom-cta-section" key={sectionId}>
              {cs.heading && <h2>{cs.heading}</h2>}
              {cs.body && <p>{cs.body}</p>}
              {cs.ctaLabel && cs.ctaLink && <a href={cs.ctaLink}>{cs.ctaLabel}</a>}
            </div>
          );
          if (cs.type === "product_carousel") {
            const carouselProducts = cs.productIds?.length
              ? products.filter((p) => cs.productIds!.includes(p.id) || cs.productIds!.includes(p.productId || ""))
              : cs.carouselCategory
                ? products.filter((p) => p.category.toLowerCase() === cs.carouselCategory!.toLowerCase())
                : products.slice(0, 8);
            return (
              <div className="custom-carousel-section" key={sectionId}>
                <div className="custom-carousel-head">
                  <h2>{cs.heading || "Featured Products"}</h2>
                  {cs.ctaLink && <a href={cs.ctaLink}>{cs.ctaLabel || "See all"}</a>}
                </div>
                <div className="custom-carousel-track">
                  {carouselProducts.map((product) => (
                    <article className="product-card" key={product.id}>
                      <div className="product-image">
                        <img src={product.image} alt={product.name} loading="lazy" />
                      </div>
                      <span className="product-badge">{product.badge || product.category}</span>
                      <h3>{product.name}</h3>
                      <div className="product-footer">
                        <strong>{formatCurrency(product.price)}</strong>
                        <AddToCartButton product={productWithPreferredSize(product, user)} ariaLabel={`Quick add ${product.name} to cart`}>
                          <ShoppingBag size={16} /><span>Quick Add</span>
                        </AddToCartButton>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        }
        return null;
      })}

      <section className="subscribe">
        <div className="hero-word">SUBSCRIBE</div>
        <div className="spark spark-two" />
        <div className="loop-mark loop-two" />
        <h2>{homepage?.newsletterHeading || "Subscribe For Exclusive Fashion Insights"}</h2>
        <p className="subscribe-copy">{homepage?.newsletterSubtext || "Get first access to limited drops, restocks, and private offers."}</p>
        <form onSubmit={handleNewsletter}>
          <input name="email" type="email" placeholder="Your email" required inputMode="email" autoComplete="email" />
          <button type="submit">Subscribe Now</button>
        </form>
        {newsletterMessage && <p className="form-message">{newsletterMessage}</p>}
      </section>

      <footer className="footer" id="shop">
        <div className="socials">
          <a href="#">Instagram</a>
          <a href="#">Tiktok</a>
          <a href="#">Youtube</a>
          <a href="#">Facebook</a>
        </div>
        <div className="footer-brand">Werd</div>
        <div className="footer-links">
          <div>
            <h3>Tops</h3>
            <a href="#">T-Shirts</a>
            <a href="#">Blouses</a>
            <a href="#">Sweaters</a>
            <a href="#">Hoodies</a>
            <a href="#">Cardigans</a>
          </div>
          <div>
            <h3>Bottoms</h3>
            <a href="#">Jeans</a>
            <a href="#">Trousers</a>
            <a href="#">Leggings</a>
            <a href="#">Shorts</a>
            <a href="#">Skirts</a>
          </div>
          <div>
            <h3>Accessories</h3>
            <a href="#">Handbags</a>
            <a href="#">Wallets</a>
            <a href="#">Belts</a>
            <a href="#">Sunglasses</a>
          </div>
        </div>
        <div className="legal">
          <a href="#">Term & Conditions</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Cookie Policy</a>
        </div>
      </footer>

      <aside className={`drawer ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
        <button className="icon-button" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
          <X size={18} />
        </button>
        <a href="/shop" onClick={() => setMenuOpen(false)}>Shop</a>
        <a href="/shop/streetwear" onClick={() => setMenuOpen(false)}>Collections</a>
        <a href="/wishlist" onClick={() => setMenuOpen(false)}>Wishlist</a>
        {isAuthenticated && <a href="/account/orders" onClick={() => setMenuOpen(false)}>My Orders</a>}
        <a href="#sale" onClick={() => setMenuOpen(false)}>Sale</a>
        <a href="#new" onClick={() => setMenuOpen(false)}>New Arrivals</a>
      </aside>

      <div className={`auth-panel ${authOpen ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="Secure login">
        <div>
          <button className="icon-button" type="button" onClick={() => setAuthOpen(false)} aria-label="Close login">
            <X size={18} />
          </button>
          <UserRound size={22} />
          <h2>Secure Login</h2>
          <p>Sign in to manage orders, saved pieces, and checkout details.</p>
          <form onSubmit={handleLogin}>
            <input name="email" type="email" placeholder="Email" autoComplete="email" required />
            <input name="password" type="password" placeholder="Password" autoComplete="current-password" required />
            <button type="submit" disabled={isPending}>
              {isPending ? "Signing In..." : "Login"}
            </button>
          </form>
          {authMessage && <p className="form-message">{authMessage}</p>}
        </div>
      </div>
    </main>
  );
}
