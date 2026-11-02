// components/home/FeaturedSection.jsx
// Selección destacada: productos elegidos a mano desde el panel (campo featured).
import ProductCard from "../ProductCard.jsx";
import DataState from "../DataState.jsx";

export default function FeaturedSection({ state }) {
  return (
    <section className="section" aria-labelledby="featured-title">
      <header className="section__head">
        <h2 id="featured-title">Selección</h2>
        <p>Piezas que hoy recomendamos por su diseño y su conexión con la obra.</p>
      </header>
      <DataState
        state={state}
        emptyText="Pronto habrá una selección destacada."
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
