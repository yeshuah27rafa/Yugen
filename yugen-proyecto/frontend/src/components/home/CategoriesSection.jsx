// components/home/CategoriesSection.jsx
// Explorar por categoría: paneles que se expanden al pasar el cursor o enfocar con teclado. Cada uno lleva al catálogo filtrado.
import { Link } from "react-router-dom";
import PieceArt from "../art/PieceArt.jsx";

const CATEGORIES = [
  { slug: "pin", name: "Pines", jp: "ピン", text: "Esmalte, metal y pequeños detalles.", seed: "Lain" },
  { slug: "manga", name: "Mangas", jp: "漫画", text: "Ediciones y volúmenes de las obras.", seed: "Akira" },
  { slug: "figura", name: "Figuras", jp: "人形", text: "Personajes en formato coleccionable.", seed: "Violet" },
  { slug: "mousepad", name: "Mousepads", jp: "盤", text: "Piezas para el escritorio.", seed: "Perfect Blue" }
];

export default function CategoriesSection() {
  return (
    <section className="section section--cats" aria-labelledby="categories-title">
      <header className="section__head" data-reveal>
        <div>
          <p className="micro">Explorar</p>
          <h2 id="categories-title">Cuatro formas de llevarse una obra.</h2>
        </div>
      </header>
      <div className="cats">
        {CATEGORIES.map((category) => (
          <Link key={category.slug} className="cat" to={`/catalogo?category=${category.slug}`}>
            <PieceArt category={category.slug} seed={category.seed} className="cat__art" />
            <span className="cat__jp" aria-hidden="true" lang="ja">{category.jp}</span>
            <span className="cat__body">
              <h3>{category.name}</h3>
              <p>{category.text}</p>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
