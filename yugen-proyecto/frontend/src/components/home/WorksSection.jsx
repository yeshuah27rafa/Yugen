// components/home/WorksSection.jsx
// Explorar por obras, en lista editorial. Crece solo con las obras que tengan productos.
import { Link } from "react-router-dom";
import DataState from "../DataState.jsx";

export default function WorksSection({ state }) {
  return (
    <section className="section" aria-labelledby="works-title">
      <header className="section__head">
        <h2 id="works-title">Explorar por obra</h2>
        <p>Cada serie tiene su propia selección. Entra a la que te interese.</p>
      </header>
      <DataState
        state={state}
        emptyText="Pronto añadiremos las obras de la tienda."
        render={(works) => (
          <ol className="works">
            {works.map((work, index) => (
              <li key={work._id}>
                <Link to={`/catalogo?work=${work.slug}`}>
                  <span className="works__n">{String(index + 1).padStart(2, "0")}</span>
                  <span className="works__title">{work.title}</span>
                  <span className="works__year">{work.year || ""}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      />
    </section>
  );
}
