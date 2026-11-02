// components/home/EditorialSection.jsx
// Filosofía de selección: explica el criterio de la tienda. Texto propio, sin atribuir significados a productos.
export default function EditorialSection() {
  return (
    <section className="editorial" aria-labelledby="editorial-title">
      <div>
        <h2 id="editorial-title">Cada pieza tiene que tener un motivo.</h2>
      </div>
      <div>
        <p>
          Yugen no vende todo lo que tiene que ver con el anime. Elige productos con una conexión visual, artística o conceptual con la obra a la que pertenecen.
        </p>
        <p>
          La selección es personal y se revisa con calma. Lo que no encaja con la obra no entra al catálogo, aunque se venda bien.
        </p>
      </div>
    </section>
  );
}
