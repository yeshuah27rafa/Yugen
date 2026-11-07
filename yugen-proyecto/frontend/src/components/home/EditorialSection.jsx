// components/home/EditorialSection.jsx
// Por qué existe Yugen: criterio de selección. Texto propio, sin atribuir significados a productos concretos.
export default function EditorialSection() {
  return (
    <section className="manifesto" id="manifiesto" aria-labelledby="editorial-title">
      <span className="manifesto__kanji" aria-hidden="true" lang="ja">幽玄</span>
      <div className="manifesto__body" data-reveal>
        <p className="micro">Por qué existe Yugen</p>
        <h2 id="editorial-title">No vendemos lo que más se pide. Guardamos lo que se queda.</h2>
        <p className="manifesto__lead">
          Yugen es una tienda curada de pines, mangas, figuras y mousepads ligados a obras concretas. La selección no depende de lo popular ni de lo difícil de conseguir, sino de una conexión real con su estética, su atmósfera o su carga simbólica.
        </p>
        <dl className="criteria">
          <div><dt>Conexión</dt><dd>Cada pieza responde a una obra específica, no a una tendencia.</dd></div>
          <div><dt>Criterio</dt><dd>Pocas piezas, y siempre con la razón por la que están aquí.</dd></div>
          <div><dt>Atmósfera</dt><dd>El objeto conserva algo del tono de la obra que lo inspira.</dd></div>
        </dl>
      </div>
      <aside className="manifesto__def" data-reveal>
        <p className="micro" lang="ja">幽玄 · yūgen</p>
        <p>Lo profundo y sutil; aquello que sugiere más de lo que muestra.</p>
      </aside>
    </section>
  );
}
