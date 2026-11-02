// components/ProductCard.jsx
// Tarjeta reutilizable: imagen principal protagonista, obra, nombre, precio y disponibilidad.
import { Link } from "react-router-dom";
import { availabilityLabel, formatPrice } from "../utils/format.js";

export default function ProductCard({ product }) {
  const image = product.mainImage;
  return (
    <Link className="product-card" to={`/producto/${product.slug}`}>
      <div className="product-card__media">
        {image ? (
          <img src={image.url} alt={image.alt || product.name} loading="lazy" />
        ) : (
          <span className="product-card__empty">Sin imagen</span>
        )}
      </div>
      <div className="product-card__body">
        <p className="product-card__work">{product.work ? product.work.title : ""}</p>
        <h3>{product.name}</h3>
        <p className="product-card__meta">
          <span>{formatPrice(product.price)}</span>
          <span className={`avail avail--${product.availability}`}>{availabilityLabel(product.availability)}</span>
        </p>
      </div>
    </Link>
  );
}
