// components/home/Hero.jsx
// Hero editorial: frase de concepto y una imagen destacada con bloque de color. Sin fondo genérico.
import { Link } from "react-router-dom";

export default function Hero({ product }) {
  const image = product ? product.mainImage : null;
  return (
    <section className="hero">
      <div className="hero__text">
        <h1 className="hero__title">Piezas que conversan con sus obras.</h1>
        <p className="hero__lead">
          Pins, mangas, figuras y mousepads de anime y manga, seleccionados por su relación visual, artística o conceptual con cada serie.
        </p>
        <Link className="button" to="/catalogo">Ver catálogo</Link>
      </div>
      <figure className="hero__figure">
        <div className="hero__block" aria-hidden="true" />
        {image ? (
          <div className="hero__frame">
            <img src={image.url} alt={image.alt || product.name} />
          </div>
        ) : (
          <div className="hero__frame hero__frame--empty">Yugen</div>
        )}
        {product ? (
          <figcaption className="hero__caption">
            {product.work ? product.work.title : ""} · {product.name}
          </figcaption>
        ) : null}
      </figure>
    </section>
  );
}
