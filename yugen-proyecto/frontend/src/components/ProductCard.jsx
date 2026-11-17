// Tarjeta reutilizable: enlace editorial y control independiente para guardar la pieza.
import { Link, useLocation } from "react-router-dom";
import { availabilityLabel, categoryLabel, formatPrice } from "../utils/format.js";
import ProductImage from "./art/ProductImage.jsx";
import WishlistToggle from "./WishlistToggle.jsx";
import { useCatalogCategories } from "./CatalogContext.jsx";

export default function ProductCard({ product, showReason }) {
  const reason = showReason && product.contexto ? product.contexto : "";
  const location = useLocation();
  const categories = useCatalogCategories();
  const categoryName = categories.find((category) => category.slug === product.category)?.name || categoryLabel(product.category);
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  return (
    <article className="product-card">
      <Link className="product-card__link" to={product.slug ? `/producto/${product.slug}` : "/favoritos"} state={{ returnTo }}>
        <div className="product-card__media">
          <ProductImage image={product.mainImage} product={product} />
          <span className="product-card__tag">{categoryName}</span>
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
      <WishlistToggle product={product} variant="floating" className="product-card__wishlist" />
    </article>
  );
}
