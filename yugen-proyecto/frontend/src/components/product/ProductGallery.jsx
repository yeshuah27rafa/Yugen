// components/product/ProductGallery.jsx
// Galería del producto: muestra la imagen seleccionada y miniaturas cuando hay más de una.
import { useEffect, useState } from "react";
import ProductImage from "../art/ProductImage.jsx";

export default function ProductGallery({ images, name, product }) {
  const list = images || [];
  const mainIndex = Math.max(0, list.findIndex((image) => image.isMain === true));
  const [selected, setSelected] = useState(mainIndex);

  useEffect(() => { setSelected(mainIndex); }, [product?._id, mainIndex]);

  if (list.length === 0) {
    return <div className="gallery__main"><ProductImage image={null} product={product} /></div>;
  }

  const current = list[selected] || list[0];

  return (
    <figure className="gallery">
      <div className="gallery__main">
        <ProductImage image={current} product={product} eager />
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
                <ProductImage image={Object.assign({}, image, { alt: "" })} product={product} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </figure>
  );
}
