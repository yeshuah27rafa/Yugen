// pages/ProductDetail.jsx
// Detalle de producto: lee el slug de la URL y pide el producto y sus relacionados a la API.
import { Link, useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi.js";
import { availabilityLabel, categoryLabel, formatPrice } from "../utils/format.js";
import ProductGallery from "../components/product/ProductGallery.jsx";
import ProductInquiry from "../components/product/ProductInquiry.jsx";
import ProductCard from "../components/ProductCard.jsx";
import DataState from "../components/DataState.jsx";

export default function ProductDetail() {
  const { slug } = useParams();
  const product = useApi(`/products/${encodeURIComponent(slug)}`);
  const related = useApi(`/products/${encodeURIComponent(slug)}/related`);

  if (product.status === "loading") {
    return <section className="detail-status"><p className="status">Cargando producto…</p></section>;
  }

  if (product.status === "error") {
    return product.httpStatus === 404 ? <NotFound /> : <LoadError message={product.error} />;
  }

  const item = product.data;
  const inStock = item.availability === "en_stock";

  return (
    <article className="detail">
      <div className="detail__top">
        <Link className="back-link" to="/catalogo">Volver al catálogo</Link>
      </div>

      <div className="detail__layout">
        <ProductGallery images={item.images} name={item.name} />

        <div className="detail__info">
          <p className="detail__meta">
            {categoryLabel(item.category)}
            {item.work ? (
              <>
                {" · "}
                <Link to={`/catalogo?work=${item.work.slug}`}>{item.work.title}</Link>
              </>
            ) : null}
          </p>
          <h1 className="detail__title">{item.name}</h1>
          <p className="detail__price">{formatPrice(item.price)}</p>
          <p className={`detail__availability detail__availability--${item.availability}`}>
            {availabilityLabel(item.availability)}
            {inStock && item.stock > 0 ? ` · ${item.stock} disponibles` : ""}
          </p>

          {item.description ? <p className="detail__description">{item.description}</p> : null}

          {item.specs && item.specs.length > 0 ? (
            <dl className="specs">
              {item.specs.map((spec, index) => (
                <div key={`${spec.label}-${index}`}>
                  <dt>{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {item.contexto ? (
            <section className="ficha" aria-labelledby="ficha-title">
              <h2 id="ficha-title">Sobre esta pieza</h2>
              <p>{item.contexto}</p>
            </section>
          ) : null}

          <ProductInquiry product={item} />
        </div>
      </div>

      <section className="detail__related" aria-labelledby="related-title">
        <header className="section__head">
          <h2 id="related-title">Piezas relacionadas</h2>
        </header>
        <DataState
          state={related}
          emptyText="Por ahora no hay otras piezas relacionadas."
          render={(items) => (
            <div className="grid">
              {items.map((relatedItem) => (
                <ProductCard key={relatedItem._id} product={relatedItem} />
              ))}
            </div>
          )}
        />
      </section>
    </article>
  );
}

// Producto inexistente: mensaje claro y salida al catálogo.
function NotFound() {
  return (
    <section className="detail-status">
      <h1>Esta pieza no está en el catálogo</h1>
      <p className="status">Puede que el enlace sea antiguo o que la pieza ya no esté disponible.</p>
      <Link className="button" to="/catalogo">Ver el catálogo</Link>
    </section>
  );
}

// Error de carga (servidor apagado, red, etc.): permite reintentar sin perder la página.
function LoadError({ message }) {
  return (
    <section className="detail-status">
      <h1>No pudimos cargar esta pieza</h1>
      <p className="status status--error">{message}</p>
      <div className="form-foot">
        <button className="button" type="button" onClick={() => window.location.reload()}>Reintentar</button>
        <Link className="link-button" to="/catalogo">Volver al catálogo</Link>
      </div>
    </section>
  );
}
