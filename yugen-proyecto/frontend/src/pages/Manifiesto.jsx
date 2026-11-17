// Página editorial ampliada: profundiza la mirada de Yugen sin sustituir el bloque de portada.
import { useState } from "react";
import { Link } from "react-router-dom";
import BackLink from "../components/layout/BackLink.jsx";
import PieceArt from "../components/art/PieceArt.jsx";
import ProductImage from "../components/art/ProductImage.jsx";
import { useApi } from "../hooks/useApi.js";
import { useReveal } from "../hooks/useReveal.js";

const PRINCIPLES = [
  { number: "01", title: "Conexión", text: "Nos acercamos a una obra por lo que despierta: una imagen que permanece, una atmósfera, una idea o una emoción. La pieza es una manera de volver a ese encuentro." },
  { number: "02", title: "Cuidado", text: "Miramos el diseño, los materiales y la relación con su universo. Cada artículo debe tener sentido dentro de la selección, sin necesitar ser raro ni difícil de encontrar." },
  { number: "03", title: "Apertura", text: "Las obras pueden venir de lugares y sensibilidades distintas. No buscamos establecer una jerarquía ni decirte qué debes apreciar; queremos compartir hallazgos y dejar espacio para tu propia lectura." }
];

function WorkCard({ work, index }) {
  const [failed, setFailed] = useState(false);
  return (
    <Link className="manifesto-work" to={`/colecciones/${work.slug}`} data-reveal style={{ "--reveal-delay": `${index * 90}ms` }}>
      <div className="manifesto-work__image">
        {work.cover && !failed
          ? <img src={work.cover} alt={`Portada de ${work.title}`} loading="lazy" onError={() => setFailed(true)} />
          : <PieceArt category="otro" seed={work.title} label={`Composición visual de ${work.title}`} />}
        <span className="manifesto-work__number">0{index + 1}</span>
      </div>
      <div className="manifesto-work__copy">
        <div><h3>{work.title}</h3>{work.year ? <span>{work.year}</span> : null}</div>
        {work.synopsis ? <p>{work.synopsis}</p> : <p>Una obra que puede abrir distintas formas de mirar y conectar.</p>}
        <span className="manifesto-work__link">Explorar colección ↗</span>
      </div>
    </Link>
  );
}

export default function Manifiesto() {
  const works = useApi("/works");
  const featured = useApi("/products/featured");
  useReveal();
  return (
    <article className="manifesto-page">
      <BackLink to="/#manifiesto">Volver a Por qué existe Yugen</BackLink>
      <header className="manifesto-page__head">
        <p className="micro">Nuestra mirada · Archivo YG-001</p>
        <h1>Una selección también puede ser una forma de encontrarse.</h1>
        <p>Yugen nace del deseo de reunir objetos que mantienen cerca algo de las obras que nos acompañan: su imagen, su atmósfera, su sensibilidad o la impresión que dejan.</p>
        <span className="manifesto-page__index" aria-hidden="true">幽玄</span>
        <span className="manifesto-page__folio" aria-hidden="true">YUGEN / 001 — PANAMÁ</span>
      </header>

      <section className="manifesto-page__opening" aria-label="La selección en imágenes">
        <div className="manifesto-page__opening-copy"><p className="micro">Una tienda construida desde la conexión</p><h2>Hay piezas que nos devuelven a una obra de otra manera.</h2><p>No todas se eligen por el mismo motivo. Algunas conservan una imagen; otras, una atmósfera, un gesto o una emoción. Nos interesa ese vínculo y lo que cada persona puede encontrar en él.</p></div>
        <div className="manifesto-page__opening-visual">
          {featured.status === "ready" && featured.data.length > 0 ? featured.data.slice(0,3).map((product,index) => <div className={`manifesto-page__piece manifesto-page__piece--${index+1}`} key={product._id}><ProductImage image={product.mainImage} product={product} /><span>{product.name}</span></div>) : <div className="manifesto-page__piece manifesto-page__piece--fallback"><PieceArt category="otro" seed="Yugen" label="Composición editorial de Yugen" /></div>}
          <span className="manifesto-page__opening-index" aria-hidden="true">YG / 002</span>
        </div>
      </section>

      <section className="manifesto-page__statement" aria-label="Nuestra intención" data-reveal>
        <p className="micro">Una mirada que invita, no que dicta</p>
        <p className="manifesto-page__statement-text">No queremos decidir qué obra merece más atención ni decirte cómo apreciarla. Compartimos aquello que nos mueve y dejamos espacio para que cada persona encuentre su propia conexión.</p>
        <span className="manifesto-page__line" aria-hidden="true" />
      </section>

      <section className="manifesto-principles" aria-labelledby="manifesto-principles-title">
        <header className="manifesto-principles__head" data-reveal>
          <p className="micro">Lo que guía la selección</p>
          <h2 id="manifesto-principles-title">Una mirada, distintas maneras de conectar.</h2>
        </header>
        <div className="manifesto-principles__grid">
          {PRINCIPLES.map((item) => (
            <article className="manifesto-principle" key={item.number} data-reveal data-watermark={item.number} style={{ "--reveal-delay": `${(Number(item.number) - 1) * 110}ms` }}>
              <span className="manifesto-principle__number">{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="manifesto-discover" aria-labelledby="manifesto-discover-title">
        <header className="manifesto-discover__head" data-reveal>
          <div><p className="micro">Un mismo espacio, distintos registros</p><h2 id="manifesto-discover-title">No todas las conexiones se parecen.</h2></div>
          <p>Lo introspectivo, lo sensible, lo surreal o lo experimental pueden convivir sin tener que parecerse. Estas obras muestran algunos de los matices que inspiran la selección.</p>
        </header>
        {works.status === "ready" ? (
          <div className="manifesto-discover__grid">
            {works.data.filter((work) => work.showOnHome !== false).slice(0, 3).map((work, index) => <WorkCard key={work._id} work={work} index={index} />)}
          </div>
        ) : works.status === "error" ? (
          <p className="status">La selección de obras estará disponible cuando el catálogo vuelva a estar conectado.</p>
        ) : (
          <div className="manifesto-discover__loading" aria-hidden="true"><span /><span /><span /></div>
        )}
        <Link className="text-link manifesto-discover__all" to="/colecciones">Explorar todas las colecciones ↗</Link>
      </section>

      <section className="manifesto-page__origin manifesto-origin" aria-labelledby="manifesto-origin-title">
        <div className="manifesto-origin__visual" data-reveal>
          <span className="manifesto-origin__overline">YUGEN / CONCEPTO 001</span>
          <span className="manifesto-origin__kanji" aria-hidden="true">幽玄</span>
          <span className="manifesto-origin__roman" aria-hidden="true">YŪ · GEN</span>
          <span className="manifesto-origin__orbit manifesto-origin__orbit--one" aria-hidden="true" />
          <span className="manifesto-origin__orbit manifesto-origin__orbit--two" aria-hidden="true" />
          <span className="manifesto-origin__caption">UNA IDEA QUE NO SE AGOTA EN UNA SOLA EXPLICACIÓN</span>
        </div>
        <div className="manifesto-origin__copy" data-reveal>
          <p className="micro">Por qué Yūgen</p>
          <h2 id="manifesto-origin-title">Un nombre para aquello que se intuye, aunque no pueda explicarse del todo.</h2>
          <p>Yūgen (幽玄) es un concepto estético japonés que suele evocar una belleza profunda, sutil y misteriosa: algo que se percibe más allá de lo evidente, pero que nunca se revela por completo.</p>
          <p>No buscamos convertir esa idea en una definición rígida. Nos inspira como una manera de acercarnos a las obras: atender a lo que sugieren, a lo que permanece después de mirarlas y a las conexiones que despiertan.</p>
          <div className="manifesto-origin__facets">
            <div><span>01 / LO SUGERIDO</span><strong>Lo que una obra deja entrever.</strong></div>
            <div><span>02 / LO QUE PERMANECE</span><strong>Una impresión que continúa después.</strong></div>
            <div><span>03 / LA CONEXIÓN</span><strong>Lo que cada persona encuentra en ella.</strong></div>
          </div>
          <p className="manifesto-origin__closing">Ese es el punto de partida de Yugen. No una respuesta definitiva, sino una invitación a seguir mirando.</p>
        </div>
      </section>

      <section className="manifesto-page__closing" data-reveal>
        <p className="micro">Sigue explorando</p>
        <h2>La conexión no se explica por completo. Se encuentra.</h2>
        <Link className="button" to="/catalogo">Explorar el catálogo</Link>
      </section>
    </article>
  );
}
