// components/home/CategoriesSection.jsx
// Explorar por categorías. Las piezas visuales son composiciones propias en CSS hasta tener arte final.
import { Link } from "react-router-dom";

const CATEGORIES = [
  { slug: "pin", name: "Pines", text: "Esmalte, metal y pequeños detalles." },
  { slug: "manga", name: "Mangas", text: "Ediciones y volúmenes de las obras." },
  { slug: "figura", name: "Figuras", text: "Personajes en formato coleccionable." },
  { slug: "mousepad", name: "Mousepads", text: "Piezas para el escritorio." }
];

export default function CategoriesSection() {
  return (
    <section className="section" aria-labelledby="categories-title">
      <header className="section__head">
        <h2 id="categories-title">Explorar por categoría</h2>
      </header>
      <div className="categories">
        {CATEGORIES.map((category) => (
          <Link key={category.slug} className="cat" to={`/catalogo?category=${category.slug}`}>
            <span className={`cat__art cat__art--${category.slug}`} aria-hidden="true" />
            <div>
              <h3>{category.name}</h3>
              <p>{category.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
