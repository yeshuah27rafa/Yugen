// components/ProductCard.jsx
// Tarjeta reutilizable: imagen protagonista, obra, nombre, precio y disponibilidad. Con showReason muestra la ficha contextual si existe.
import { Link, useLocation } from "react-router-dom";
import { availabilityLabel, categoryLabel, formatPrice } from "../utils/format.js";
import ProductImage from "./art/ProductImage.jsx";

export default function ProductCard({ product, showReason }) {
  const reason = showReason && product.contexto ? product.contexto : "";
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  return (
    <Link className="product-card" to={`/producto/${product.slug}`} state={{ returnTo }}>
      <div className="product-card__media">
        <ProductImage image={product.mainImage} product={product} />
        <span className="product-card__tag">{categoryLabel(product.category)}</span>
        {product.availability === "agotado" ? <span className="product-card__sold">Agotado</span> : null}
      </div>
      <div className="product-card__body">
        <p className="product-card__work">{product.work ? product.work.title : ""}</p>
        <h3>{product.name}</h3>
        {reason !== "" ? <p className="product-card__reason">{reason}</p> : null}
        <p className="product-card__meta">
          <span className="product-card__price">{formatPrice(product.price)}</span>
          <span className={`avail avail--${product.availability}`}>{availabilityLabel(product.availability)}</span>
        </p>
      </div>
    </Link>
  );
}
