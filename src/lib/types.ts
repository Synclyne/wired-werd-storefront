export type Product = {
  id: string;
  productId?: string;
  name: string;
  slug: string;
  category: string;
  gender?: string;
  description: string;
  details?: string;
  price: number;
  comparePrice?: number | null;
  image: string;
  images?: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  badge?: string;
  variantId?: string;
  size?: string;
  color?: string;
  sizes?: string[];
  colors?: string[];
  variants?: Array<{ _id?: string; id?: string; size: string; color: string; colorHex?: string; stock: number; sku?: string }>;
  rating?: number;
  numReviews?: number;
  totalStock?: number;
  reviews?: Array<{ _id?: string; id?: string; name?: string; rating: number; comment: string; createdAt?: string }>;
};

export type HomepageConfig = {
  announcementText?: string;
  announcementVisible?: boolean;
  heroSlides?: Array<{
    tagline?: string;
    title?: string;
    ctaLabel?: string;
    ctaLink?: string;
    category?: string;
    imageUrl?: string;
    bgColor?: string;
    darkText?: boolean;
  }>;
  tickerText?: string;
  tickerVisible?: boolean;
  featuredCards?: Array<{
    title?: string;
    category?: string;
    bg?: string;
    imageUrl?: string;
    dark?: boolean;
  }>;
  collectionTitle?: string;
  collectionSubtext?: string;
  banner?: {
    heading?: string;
    subheading?: string;
    ctaLabel?: string;
    ctaLink?: string;
    imageUrlLeft?: string;
    imageUrlRight?: string;
  };
  sectionOrder?: string[];
  buyTheFits?: Array<{
    id: string;
    title?: string;
    kicker?: string;
    copy?: string;
    modelImage?: string;
    ctaLabel?: string;
    ctaLink?: string;
    productSlugs?: string[];
    visible?: boolean;
  }>;
  customSections?: Array<{
    id: string;
    type?: string;
    visible?: boolean;
    heading?: string;
    subtext?: string;
    imageUrl?: string;
    ctaLabel?: string;
    ctaLink?: string;
    body?: string;
    order?: number;
    carouselCategory?: string;
    productIds?: string[];
  }>;
  newsletterHeading?: string;
  newsletterSubtext?: string;
};

export type HomepagePayload = {
  products: Product[];
  featured: Product[];
  homepage?: HomepageConfig | null;
};
