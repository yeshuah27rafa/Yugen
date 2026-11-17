// components/home/Hero.jsx
// Portada: collage de papeles recortados con las piezas destacadas como protagonistas. Reacciona al cursor y al scroll.
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ProductImage from "../art/ProductImage.jsx";

// Piezas de muestra para cuando todavía no hay destacados cargados.
const FALLBACK = [
  { name: "Pin esmaltado", category: "pin", work: { title: "Lain" } },
  { name: "Manga edición especial", category: "manga", work: { title: "Evangelion" } },
  { name: "Figura de colección", category: "figura", work: { title: "Violet Evergarden" } }
];

const PLATES = [
  { cls: "plate--a", clip: "polygon(2% 4%,38% 0,64% 3%,98% 1%,100% 40%,97% 72%,100% 99%,60% 100%,30% 97%,0 100%,3% 60%)" },
  { cls: "plate--b", clip: "polygon(0 6%,30% 2%,70% 6%,100% 0,97% 50%,100% 100%,60% 96%,25% 100%,3% 94%,5% 50%)" },
  { cls: "plate--c", clip: "polygon(4% 0,100% 3%,96% 35%,100% 66%,95% 100%,50% 97%,0 100%,4% 55%,0 30%)" }
];

export default function Hero({ products }) {
  const ref = useRef(null);
  const frame = useRef(0);
  const list = (products && products.length > 0 ? products : FALLBACK).slice(0, 3);

  useEffect(() => {
    const node = ref.current;
    if (node === null || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const state = { mx: 0, my: 0 };
    function apply() {
      frame.current = 0;
      node.style.setProperty("--mx", state.mx.toFixed(3));
      node.style.setProperty("--my", state.my.toFixed(3));
      node.style.setProperty("--sy", String(Math.min(window.scrollY, 900)));
    }
    function schedule() { if (frame.current === 0) frame.current = requestAnimationFrame(apply); }
    function onMove(event) {
      const box = node.getBoundingClientRect();
      state.mx = (event.clientX - box.left) / box.width - 0.5;
      state.my = (event.clientY - box.top) / box.height - 0.5;
      schedule();
    }
    node.addEventListener("pointermove", onMove);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      node.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <section className="hero" ref={ref} aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true">
        <span className="hero__kanji" lang="ja">幽玄</span>
        <span className="hero__dots" />
        <svg className="hero__ink" viewBox="0 0 600 160" preserveAspectRatio="none"><path d="M6 110 C70 20 160 150 250 70 S420 10 470 90 S560 60 594 30" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" /></svg>
      </div>

      <div className="hero__copy">
        <p className="micro">Archivo 001 · Panamá</p>
        <h1 id="hero-title" className="hero__title">Piezas elegidas por una razón.</h1>
        <p className="hero__lead">Pines, mangas, figuras y mousepads ligados a obras concretas, con la razón escrita junto a cada uno.</p>
        <div className="hero__actions">
          <Link className="button" to="/catalogo">Ver el catálogo</Link>
          <Link className="text-link" to="/#manifiesto">Cómo elegimos</Link>
        </div>
      </div>

      <div className="hero__stage">
        {list.map((product, index) => {
          const plate = PLATES[index];
          const real = Boolean(product._id);
          const inner = (
            <>
              <span className="plate__paper" style={{ clipPath: plate.clip }} />
              <span className="plate__img" style={{ clipPath: plate.clip }}>
                <ProductImage image={product.mainImage} product={product} eager />
              </span>
              <span className="plate__tag">{product.work ? product.work.title : product.name}</span>
            </>
          );
          return real ? (
            <Link key={product._id} className={`plate ${plate.cls}`} to={`/producto/${product.slug}`} aria-label={`${product.name}${product.work ? `, ${product.work.title}` : ""}`}>{inner}</Link>
          ) : (
            <div key={product.name} className={`plate ${plate.cls}`} aria-hidden="true">{inner}</div>
          );
        })}
        <p className="hero__vertical micro" aria-hidden="true">Una sensación difícil de explicar</p>
      </div>
    </section>
  );
}
