// Categorías configurables desde administración; las cuatro originales se mantienen como punto de partida.
import { Link } from "react-router-dom";
import CategoryArtwork from "./CategoryArtwork.jsx";

const DEFAULT_CATEGORIES = [
  { slug: "pin", name: "Pines", description: "Esmalte, metal y pequeños detalles.", kanji: "ピン", seed: "Lain" },
  { slug: "manga", name: "Mangas", description: "Ediciones y volúmenes de las obras.", kanji: "漫画", seed: "Akira" },
  { slug: "figura", name: "Figuras", description: "Personajes en formato coleccionable.", kanji: "人形", seed: "Violet" },
  { slug: "mousepad", name: "Mousepads", description: "Piezas para el escritorio.", kanji: "盤", seed: "Perfect Blue" }
];

export default function CategoriesSection({ state }) {
  const isLoading = state.status === "loading";
  const categories = state.status === "ready"
    ? state.data.filter((category) => category.showOnHome !== false && category.active !== false)
    : state.status === "error" ? DEFAULT_CATEGORIES : [];

  return (
    <section className="section section--cats" aria-labelledby="categories-title" aria-busy={isLoading ? "true" : "false"}>
      <header className="section__head section__head--categories" data-reveal>
        <div>
          <p className="micro">Explorar · Formatos</p>
          <h2 id="categories-title">Maneras de llevarse una obra.</h2>
        </div>
        <p>Una misma conexión puede acompañarte de distintas maneras. Desliza para recorrer las piezas.</p>
      </header>
      {isLoading ? (
        <div className="cats cats--loading" aria-hidden="true">{[0, 1, 2, 3].map((index) => <span className="cat-skeleton" key={index} />)}</div>
      ) : categories.length > 0 ? (
        <div className="cats-viewport" role="region" aria-label="Categorías de productos; desplázate horizontalmente" tabIndex={0}>
          <div className="cats">
            {categories.map((category, index) => (
              <Link key={category._id || category.slug} className="cat" to={`/catalogo?category=${category.slug}`} style={{ "--cat-index": index }}>
                <CategoryArtwork category={category} />
                {category.kanji ? <span className="cat__jp" aria-hidden="true" lang="ja">{category.kanji}</span> : null}
                <span className="cat__body">
                  <span className="micro">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <span className="cat__explore">Explorar piezas ↗</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <p className="status categories-empty">Las categorías aparecerán aquí cuando estén configuradas desde administración.</p>
      )}
    </section>
  );
}
