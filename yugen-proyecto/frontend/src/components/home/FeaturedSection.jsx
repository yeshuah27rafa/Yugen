// components/home/FeaturedSection.jsx
// Selección destacada: productos elegidos a mano desde el panel (campo featured), en una cuadrícula asimétrica.
import ProductCard from "../ProductCard.jsx";
import DataState from "../DataState.jsx";

export default function FeaturedSection({ state }) {
  return (
    <section className="section section--pick" id="seleccion" aria-labelledby="featured-title">
      <header className="section__head" data-reveal>
        <div>
          <p className="micro">Selección</p>
          <h2 id="featured-title">Piezas que hoy recomendamos.</h2>
        </div>
        <p>Elegidas por su diseño y su conexión con la obra. Cuando hay una historia que contar, también la encontrarás en su ficha.</p>
      </header>
      <DataState
        state={state}
        emptyText="Pronto habrá una selección destacada."
        render={(products) => (
          <div className="pick">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} showReason />
            ))}
          </div>
        )}
      />
    </section>
  );
}
