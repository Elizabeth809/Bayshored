import { useEffect, useMemo, useState } from "react";
import { CLIENT_BASE_URL } from "../components/others/clientApiUrl";
import HeroArtSlider from "../components/HomeComponents/HeroSlider";
import TrustBar from "../components/HomeComponents/TrustBar";
import AnimatedBanner from "../components/HomeComponents/AnimatedBanner";
import ArtistRail from "../components/HomeComponents/ArtistRail";
import ProductRail from "../components/HomeComponents/ProductRail";
import NewsletterSubscription from "../components/HomeComponents/NewsletterSubscription";
import AboutCompanySection from "../components/HomeComponents/AboutCompanySection";
import ArtProcessSection from "../components/HomeComponents/ArtProcessSection";

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");

        const [pRes, aRes, cRes] = await Promise.all([
          fetch(`${CLIENT_BASE_URL}/api/v1/products`, { signal: ac.signal }),
          fetch(`${CLIENT_BASE_URL}/api/v1/authors`, { signal: ac.signal }),
          fetch(`${CLIENT_BASE_URL}/api/v1/categories`, { signal: ac.signal }),
        ]);

        const [pData, aData, cData] = await Promise.all([
          pRes.json(),
          aRes.json(),
          cRes.json(),
        ]);

        if (!pRes.ok) throw new Error(pData?.message || "Failed to load products");
        if (!aRes.ok) throw new Error(aData?.message || "Failed to load artists");
        if (!cRes.ok) throw new Error(cData?.message || "Failed to load categories");

        // Your backend likely returns { success, data } or { success, data: { items } }.
        // We'll support both patterns safely:
        const pList = pData?.data?.products || pData?.data || pData?.products || [];
        const aList = aData?.data?.authors || aData?.data || aData?.authors || [];
        const cList = cData?.data?.categories || cData?.data || cData?.categories || [];

        setProducts(Array.isArray(pList) ? pList : []);
        setAuthors(Array.isArray(aList) ? aList : []);
        setCategories(Array.isArray(cList) ? cList : []);
      } catch (e) {
        if (e?.name !== "AbortError") setError(e?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  const featured = useMemo(() => products.slice(0, 12), [products]);

  const onSale = useMemo(() => {
    return products
      .filter(
        (p) =>
          (p?.mrpPrice && p?.discountPrice && p.discountPrice < p.mrpPrice) ||
          (p?.price && p?.discountPrice && p.discountPrice < p.price)
      )
      .slice(0, 12);
  }, [products]);

  const collectorsVault = useMemo(() => {
    return products.filter((p) => p?.askForPrice === true).slice(0, 12);
  }, [products]);

  const topCategories = useMemo(() => categories.slice(0, 10), [categories]);

  return (
    <main className="min-h-screen bg-neutral-50 text-black">
      <HeroArtSlider categories={topCategories} />
      <AboutCompanySection />
      <ArtistRail
          title="Meet Our Artists"
          subtitle="Discover the stories behind every brushstroke."
          loading={loading}
          authors={authors}
          viewAllHref="/artists"
        />
        <ArtProcessSection />
        
        <AnimatedBanner />
        <ProductRail
          title="Featured Originals"
          subtitle="Handpicked paintings curated for modern collectors in the USA."
          loading={loading}
          products={featured}
          viewAllHref="/products"
        />
        <TrustBar />
         <NewsletterSubscription />

      {/* <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        ) : null}

        
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
        
      </section>

      <div className="relative">
        
      </div>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
       
      </section> */}
    </main>
  );
};

export default HomePage;