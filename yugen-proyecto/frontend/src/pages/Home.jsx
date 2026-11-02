// pages/Home.jsx
// Portada: pide destacados, novedades y obras una sola vez y los reparte entre las secciones.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useApi } from "../hooks/useApi.js";
import Hero from "../components/home/Hero.jsx";
import FeaturedSection from "../components/home/FeaturedSection.jsx";
import CategoriesSection from "../components/home/CategoriesSection.jsx";
import WorksSection from "../components/home/WorksSection.jsx";
import EditorialSection from "../components/home/EditorialSection.jsx";
import NewSection from "../components/home/NewSection.jsx";
import ContactSection from "../components/home/ContactSection.jsx";

export default function Home() {
  const featured = useApi("/products/featured");
  const newest = useApi("/products/new");
  const works = useApi("/works");
  const location = useLocation();

  // Permite llegar con /#contacto desde el encabezado y hace scroll suave hasta la sección.
  useEffect(() => {
    if (location.hash !== "") {
      const target = document.getElementById(location.hash.slice(1));
      if (target !== null) target.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  const heroProduct = featured.data !== null && featured.data.length > 0 ? featured.data[0] : null;

  return (
    <>
      <Hero product={heroProduct} />
      <FeaturedSection state={featured} />
      <CategoriesSection />
      <WorksSection state={works} />
      <EditorialSection />
      <NewSection state={newest} />
      <ContactSection />
    </>
  );
}
