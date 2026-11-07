// components/art/ProductImage.jsx
// Imagen de una pieza: usa la foto real cuando existe y una composición provisional cuando no.
import { isPlaceholderUrl } from "../../utils/artwork.js";
import PieceArt from "./PieceArt.jsx";

export default function ProductImage({ image, product, eager }) {
  const name = product ? product.name : "";
  const seed = product && product.work ? product.work.title : name;
  if (image && isPlaceholderUrl(image.url) === false) {
    return <img src={image.url} alt={image.alt || name} loading={eager ? "eager" : "lazy"} decoding="async" />;
  }
  return <PieceArt category={product ? product.category : "otro"} seed={seed} label={name} />;
}
