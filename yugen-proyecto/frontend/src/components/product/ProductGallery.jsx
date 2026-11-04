// components/product/ProductGallery.jsx
// Galería del producto: muestra la imagen seleccionada y miniaturas cuando hay más de una.
import { useState } from "react";

export default function ProductGallery({ images, name }) {
  const list = images || [];
  const mainIndex = Math.max(0, list.findIndex((image) => image.isMain === true));
  const [selected, setSelected] = useState(mainIndex);

  if (list.length === 0) {
    return <div className="gallery__empty">Sin imagen</div>;
  }

  const current = list[selected] || list[0];

  return (
    <figure className="gallery">
      <div className="gallery__main">
        <img src={current.url} alt={current.alt || name} decoding="async" />
      </div>
      {list.length > 1 ? (
        <ul className="gallery__thumbs" aria-label="Imágenes del producto">
          {list.map((image, index) => (
            <li key={`${image.url}-${index}`}>
              <button
                type="button"
                aria-label={`Ver imagen ${index + 1}`}
                aria-pressed={index === selected}
                onClick={() => setSelected(index)}
              >
                <img src={image.url} alt="" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </figure>
  );
}
