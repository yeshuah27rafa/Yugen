// components/home/EditorialTeaser.jsx
// Acceso editorial breve: el manifiesto completo vive en una página propia.
import { Link } from "react-router-dom";

export default function EditorialTeaser() {
  return (
    <section className="manifesto-teaser" aria-labelledby="manifesto-teaser-title">
      <div>
        <p className="micro">Por qué existe Yugen</p>
        <h2 id="manifesto-teaser-title">No vendemos lo que más se pide. Guardamos lo que se queda.</h2>
      </div>
      <Link className="button button--light" to="/manifiesto">Conoce nuestra mirada</Link>
    </section>
  );
}
