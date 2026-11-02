// components/home/NewSection.jsx
// Novedades: las últimas piezas incorporadas al catálogo.
import ProductCard from "../ProductCard.jsx";
import DataState from "../DataState.jsx";

export default function NewSection({ state }) {
  return (
    <section className="section" aria-labelledby="new-title">
      <header className="section__head">
        <h2 id="new-title">Novedades</h2>
        <p>Lo último que entró a la tienda.</p>
      </header>
      <DataState
        state={state}
        emptyText="Todavía no hay novedades."
        render={(products) => (
          <div className="grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      />
    </section>
  );
}
