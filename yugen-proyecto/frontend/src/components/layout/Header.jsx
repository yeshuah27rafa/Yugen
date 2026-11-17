// components/layout/Header.jsx
// Encabezado fijo. Izquierda: Catálogo y Colecciones. Derecha: Buscar, Cuenta y Carrito. Menús con hover, clic, teclado y Escape.
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { categoryOptionsFromState } from "../../utils/catalogOptions.js";
import { useIsAdmin } from "../AdminContext.jsx";

export default function Header({ works, categories, cartCount, onOpenCart, wishlistCount = 0, onOpenWishlist }) {
  const [open, setOpen] = useState(null); // shop | col | search | acc | menu | null
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const wrapRef = useRef(null);
  const searchRef = useRef(null);
  const closeTimer = useRef(0);
  const workList = works.status === "ready" ? works.data : [];
  const categoryList = categoryOptionsFromState(categories, false);

  useEffect(() => { setOpen(null); }, [location.pathname, location.search]);

  useEffect(() => {
    function onKey(event) { if (event.key === "Escape") setOpen(null); }
    function onDown(event) {
      if (wrapRef.current !== null && wrapRef.current.contains(event.target) === false) setOpen(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);

  useEffect(() => {
    if (open === "search" && searchRef.current !== null) searchRef.current.focus();
  }, [open]);

  function hoverOpen(name) {
    if (window.matchMedia("(hover: hover)").matches === false) return;
    clearTimeout(closeTimer.current);
    setOpen(name);
  }
  function hoverLeave() {
    if (window.matchMedia("(hover: hover)").matches === false) return;
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpen((current) => (current === "search" || current === "menu" ? current : null));
    }, 200);
  }
  function hoverKeep() { clearTimeout(closeTimer.current); }
  function toggle(name) { setOpen((current) => (current === name ? null : name)); }

  function handleWordmarkClick(event) {
    if (location.pathname === "/" && location.hash === "#hero") {
      event.preventDefault();
      const hero = document.getElementById("hero");
      if (hero) {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        hero.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
    }
  }

  function submitSearch(event) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("q") || "").trim();
    navigate(value === "" ? "/catalogo" : `/catalogo?q=${encodeURIComponent(value)}`);
  }

  function trigger(name, label, extra) {
    return (
      <button
        type="button"
        className="nav-link"
        aria-expanded={open === name}
        aria-controls={`panel-${name}`}
        onClick={() => toggle(name)}
        onMouseEnter={() => hoverOpen(name)}
        onMouseLeave={hoverLeave}
        {...extra}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="site-top" ref={wrapRef}>
      <header className="site-header">
        <nav className="nav nav--left" aria-label="Principal">
          <span className="nav-split">
            <Link className="nav-link nav-link--first" to="/catalogo" onMouseEnter={() => hoverOpen("shop")} onMouseLeave={hoverLeave}>Catálogo</Link>
            <Link className="nav-link" to="/colecciones" onMouseEnter={() => hoverOpen("col")} onMouseLeave={hoverLeave} onFocus={() => setOpen("col")}>Colecciones</Link>
            <Link className="nav-link nav-link--editorial" to="/manifiesto">Por qué existe Yugen</Link>
          </span>
          <button type="button" className="nav-link nav-menu" aria-expanded={open === "menu"} aria-controls="panel-menu" onClick={() => toggle("menu")}>
            {open === "menu" ? "Cerrar" : "Menú"}
          </button>
        </nav>

        <Link className="wordmark" to="/#hero" onClick={handleWordmarkClick} aria-label="Yugen, volver al inicio de la portada">
          <svg className="wordmark__home" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m3.5 10.5 8.5-7 8.5 7" />
            <path d="M5.5 9.5v10h13v-10M9.5 19.5v-6h5v6" />
          </svg>
          YUGEN<span lang="ja" aria-hidden="true">幽玄</span>
        </Link>

        <nav className="nav nav--right" aria-label="Búsqueda, cuenta, lista de deseos y carrito">
          {trigger("search", "Buscar", { className: "nav-link nav-hide-sm" })}
          <Link className="nav-link nav-hide-sm" to="/cuenta" onMouseEnter={() => hoverOpen("acc")} onMouseLeave={hoverLeave}>Cuenta</Link>
          <button type="button" className="nav-link nav-show-sm" aria-expanded={open === "search"} aria-controls="panel-search" onClick={() => toggle("search")}>Buscar</button>
          <button className="nav-link nav-wishlist" type="button" onClick={onOpenWishlist} aria-label={`Abrir lista de deseos, ${wishlistCount} ${wishlistCount === 1 ? "pieza" : "piezas"}`}>
            <span aria-hidden="true">♡</span> <span className="nav-wishlist__label">Deseos</span> <span className="badge" aria-hidden="true">{wishlistCount}</span>
          </button>
          <button className="nav-link nav-cart" type="button" onClick={onOpenCart} aria-label={`Abrir vista rápida del carrito, ${cartCount} ${cartCount === 1 ? "pieza" : "piezas"}`}>
            Carrito <span className="badge" aria-hidden="true">{cartCount}</span>
          </button>
        </nav>
      </header>

      <div className={`panel${open === "shop" ? " is-on" : ""}`} id="panel-shop" onMouseEnter={hoverKeep} onMouseLeave={hoverLeave} hidden={open !== "shop"}>
        <ul className="panel__list">
          <li><Link to="/catalogo">Todo el catálogo</Link></li>
          {categoryList.map((c) => <li key={c.value}><Link to={`/catalogo?category=${c.value}`}>{c.label}</Link></li>)}
        </ul>
      </div>

      <div className={`panel${open === "col" ? " is-on" : ""}`} id="panel-col" onMouseEnter={hoverKeep} onMouseLeave={hoverLeave} hidden={open !== "col"}>
        <div className="panel__heading"><p className="panel__label">Colecciones por obra</p><Link className="panel__all" to="/colecciones">Ver todas las colecciones ↗</Link></div>
        {works.status === "loading" ? <p className="status">Cargando obras…</p> : null}
        {works.status === "error" ? <p className="status">No pudimos cargar las obras. <Link className="link-button" to="/catalogo">Ver todo el catálogo</Link></p> : null}
        {works.status === "ready" && workList.length === 0 ? <p className="status">Pronto añadiremos las obras de la tienda.</p> : null}
        <ul className="panel__list panel__list--cols">
          {workList.map((w) => <li key={w._id}><Link to={`/colecciones/${w.slug}`}>{w.title}{w.year ? <small>{w.year}</small> : null}</Link></li>)}
        </ul>
      </div>

      <div className={`panel${open === "search" ? " is-on" : ""}`} id="panel-search" hidden={open !== "search"}>
        <form role="search" onSubmit={submitSearch} className="panel__search">
          <label className="sr-only" htmlFor="header-search">Buscar piezas por nombre</label>
          <input id="header-search" ref={searchRef} name="q" type="search" placeholder="Busca una pieza por nombre" autoComplete="off" />
          <button className="button" type="submit">Buscar</button>
        </form>
      </div>

      <div className={`panel${open === "menu" ? " is-on" : ""}`} id="panel-menu" hidden={open !== "menu"}>
        <ul className="panel__list">
          <li><Link to="/catalogo">Catálogo</Link></li>
          {categoryList.map((c) => <li key={c.value}><Link className="sub" to={`/catalogo?category=${c.value}`}>{c.label}</Link></li>)}
          <li><Link to="/colecciones">Todas las colecciones</Link></li>
          <li><Link to="/manifiesto">Por qué existe Yugen</Link></li>
          <li><Link to="/cuenta">Cuenta</Link></li>
          <li><Link to="/favoritos">Mi lista de deseos ({wishlistCount})</Link></li>
          <li><Link to="/carrito">Carrito completo ({cartCount})</Link></li>
          <li><Link to="/#contacto">Contacto</Link></li>
          {isAdmin ? <li><Link to="/admin">Administración</Link></li> : null}
        </ul>
      </div>

      <div className={`panel panel--small${open === "acc" ? " is-on" : ""}`} id="panel-acc" onMouseEnter={hoverKeep} onMouseLeave={hoverLeave} hidden={open !== "acc"}>
        <ul className="panel__list">
          <li><Link to="/cuenta/entrar">Entrar</Link></li>
          <li><Link to="/cuenta/registro">Crear cuenta</Link></li>
          <li><Link to="/cuenta/solicitudes">Mis solicitudes</Link></li>
          <li><Link to="/favoritos">Mi lista de deseos ({wishlistCount})</Link></li>
          {isAdmin ? <li><Link to="/admin">Administración</Link></li> : null}
        </ul>
      </div>
    </div>
  );
}
