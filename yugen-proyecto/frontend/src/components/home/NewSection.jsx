// components/home/NewSection.jsx
// Novedades: las últimas piezas incorporadas, en una tira horizontal con desplazamiento por teclado y táctil.
import { Link } from "react-router-dom";
import ProductCard from "../ProductCard.jsx";
import DataState from "../DataState.jsx";

export default function NewSection({ state }) {
  return (
    <section className="section section--new" aria-labelledby="new-title">
      <header className="section__head" data-reveal>
        <div>
          <p className="micro">Novedades</p>
          <h2 id="new-title">Recién llegadas.</h2>
        </div>
        <Link className="text-link" to="/catalogo">Ver todo el catálogo</Link>
      </header>
      <DataState
        state={state}
        emptyText="Todavía no hay novedades."
        render={(products) => (
          <div className="strip" tabIndex={0} role="group" aria-label="Novedades, desplázate horizontalmente">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      />
    </section>
  );
}
