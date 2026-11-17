// pages/Home.jsx
// Portada editorial: conserva la secuencia original y suma las capacidades dinámicas del catálogo.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useApi } from "../hooks/useApi.js";
import { useReveal } from "../hooks/useReveal.js";
import Hero from "../components/home/Hero.jsx";
import ScrollBands from "../components/home/ScrollBands.jsx";
import EditorialSection from "../components/home/EditorialSection.jsx";
import FeaturedSection from "../components/home/FeaturedSection.jsx";
import CategoriesSection from "../components/home/CategoriesSection.jsx";
import WorksSection from "../components/home/WorksSection.jsx";
import NewSection from "../components/home/NewSection.jsx";
import ContactSection from "../components/home/ContactSection.jsx";

export default function Home() {
  const featured = useApi("/products/featured");
  const recommended = useApi("/products/recommended");
  const categories = useApi("/catalog/categories");
  const newest = useApi("/products/new");
  const works = useApi("/works");
  const location = useLocation();
  useReveal();

  useEffect(() => {
    if (location.hash !== "") {
      const target = document.getElementById(location.hash.slice(1));
      if (target !== null) {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
    }
  }, [location.hash]);

  const heroProducts = featured.data !== null && featured.data.length > 0 ? featured.data : null;

  return (
    <>
      <Hero products={heroProducts} />
      <ScrollBands works={works} categories={categories} />
      <EditorialSection />
      <FeaturedSection state={recommended} />
      <CategoriesSection state={categories} />
      <WorksSection state={works} />
      <NewSection state={newest} />
      <ContactSection />
    </>
  );
}
