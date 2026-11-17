import { Link } from "react-router-dom";
import BackLink from "../components/layout/BackLink.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useWishlist } from "../components/WishlistContext.jsx";

export default function Favoritos() {
  const { items, count, syncError } = useWishlist();
  return (
    <section className="wishlist-page">
      <BackLink to="/catalogo">Volver al catálogo</BackLink>
      <header className="wishlist-page__head">
        <div><p className="micro">Tu selección personal · {String(count).padStart(2, "0")} piezas</p><h1>Una lista para volver.</h1><p>Guarda aquí aquello que te gustaría encontrar de nuevo.</p></div>
        <span aria-hidden="true">♡</span>
      </header>
      {syncError ? <p className="status status--error" role="alert">{syncError}</p> : null}
      {items.length === 0 ? (
        <div className="account-empty wishlist-page__empty"><p className="micro">Aún no hay piezas guardadas</p><h2>Hay algo que te gustaría recordar.</h2><p>Al recorrer el catálogo, utiliza el corazón para reunir las piezas que quieras tener cerca.</p><Link className="button" to="/catalogo">Explorar piezas</Link></div>
      ) : (
        <div className="grid wishlist-page__grid">{items.map((item) => <ProductCard key={item.id} product={item} />)}</div>
      )}
    </section>
  );
}
