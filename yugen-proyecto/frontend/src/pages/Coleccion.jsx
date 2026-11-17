// Página de colección por obra: utiliza portada y descripción administrables y agrupa sus piezas.
import { Link, useLocation, useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi.js";
import DataState from "../components/DataState.jsx";
import ProductCard from "../components/ProductCard.jsx";
import BackLink from "../components/layout/BackLink.jsx";
import PieceArt from "../components/art/PieceArt.jsx";
import { useState } from "react";

function CollectionCover({ work }) {
  const [failed, setFailed] = useState(false);
  if (work.cover && !failed) return <img src={work.cover} alt={`Portada editorial de ${work.title}`} onError={() => setFailed(true)} />;
  return <PieceArt category="otro" seed={work.title} label={`Composición de ${work.title}`} />;
}

export default function Coleccion() {
  const { slug } = useParams();
  const location = useLocation();
  const returnTo = location.state?.returnTo || "/colecciones";
  const work = useApi(`/works/${encodeURIComponent(slug)}`);
  const products = useApi(`/products?work=${encodeURIComponent(slug)}`);

  if (work.status === "loading") return <section className="collection-page"><p className="status status--loading">Cargando colección…</p></section>;
  if (work.status === "error") {
    return <section className="collection-page"><BackLink to={returnTo}>Volver a colecciones</BackLink><h1>Esta colección no está disponible</h1><p className="status status--error">{work.error}</p><Link className="button" to="/catalogo">Explorar catálogo</Link></section>;
  }

  const item = work.data;
  return (
    <article className="collection-page">
      <BackLink to={returnTo}>Volver al índice de obras</BackLink>
      <header className="collection-hero">
        <div className="collection-hero__cover"><CollectionCover work={item} /></div>
        <div className="collection-hero__copy">
          <p className="micro">Colección · Archivo YG</p>
          <h1>{item.title}</h1>
          {item.year ? <p className="collection-hero__year">{item.year}</p> : null}
          {item.synopsis ? <p className="collection-hero__synopsis">{item.synopsis}</p> : <p className="collection-hero__synopsis">Una colección de piezas vinculadas a este universo.</p>}
          <Link className="text-link" to={`/catalogo?work=${encodeURIComponent(item.slug)}`}>Ver todas las piezas de esta obra ↗</Link>
        </div>
        <span className="collection-hero__ghost" aria-hidden="true">{item.title.slice(0, 1)}</span>
      </header>
      <section className="collection-products" aria-labelledby="collection-products-title">
        <header className="section__head">
          <div><p className="micro">Dentro de esta colección</p><h2 id="collection-products-title">Piezas relacionadas.</h2></div>
          <p>Objetos distintos, conectados por una misma obra.</p>
        </header>
        <DataState state={products} emptyText="Todavía no hay piezas asociadas a esta obra." render={(items) => (
          <div className="grid">{items.map((product) => <ProductCard key={product._id} product={product} />)}</div>
        )} />
      </section>
      <div className="collection-page__more"><Link className="button" to="/catalogo">Volver al catálogo</Link></div>
    </article>
  );
}
