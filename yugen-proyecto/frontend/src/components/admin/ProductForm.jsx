// components/admin/ProductForm.jsx
// Formulario de alta y edición: datos, precio opcional, disponibilidad, imágenes, características y ficha.
import { useEffect, useState } from "react";
import { apiPost, apiPut } from "../../api/client.js";

const MAX_IMAGES = 8;
const MAX_SPECS = 10;
const AVAILABILITY_CHOICES = [
  { value: "en_stock", label: "En stock" },
  { value: "pedido_exterior", label: "Pedido al exterior" },
  { value: "agotado", label: "Agotado" }
];

// Convierte la pieza de la API en un borrador editable. Una pieza nueva empieza con valores por defecto.
function toDraft(product) {
  if (product === null) {
    return {
      name: "", slug: "", category: "pin", work: "", price: "", stock: 0,
      availability: "en_stock", description: "", contexto: "", featured: false, recommended: false, featuredOrder: 0, recommendedOrder: 0,
      images: [{ url: "", alt: "", isMain: true }], specs: []
    };
  }
  return {
    name: product.name,
    slug: product.slug,
    category: product.category,
    work: product.work ? product.work._id : "",
    price: product.price === null ? "" : String(product.price),
    stock: product.stock,
    availability: product.availability,
    description: product.description || "",
    contexto: product.contexto || "",
    featured: product.featured === true,
    recommended: product.recommended === true || (product.recommended === undefined && product.featured === true),
    featuredOrder: Number.isInteger(product.featuredOrder) ? product.featuredOrder : 0,
    recommendedOrder: Number.isInteger(product.recommendedOrder) ? product.recommendedOrder : 0,
    images: product.images.map((image) => ({ url: image.url, alt: image.alt || "", isMain: image.isMain === true })),
    specs: product.specs.map((spec) => ({ label: spec.label, value: spec.value }))
  };
}

export default function ProductForm({ product, worksState, categoriesState, onSaved, onCancel }) {
  const worksReady = worksState.status === "ready";
  const works = worksReady ? worksState.data : [];
  const categoriesReady = categoriesState && categoriesState.status === "ready";
  const categories = categoriesReady ? categoriesState.data : [];
  const categoryChoices = categories.filter((category) => category.active !== false || (product && category.slug === product.category));
  const [draft, setDraft] = useState(() => toDraft(product));
  useEffect(() => {
    if (!categoriesReady || categoryChoices.length === 0) return;
    if (!categoryChoices.some((category) => category.slug === draft.category)) {
      setDraft((current) => ({ ...current, category: categoryChoices[0].slug }));
    }
  }, [categoriesReady, categoriesState?.data, product?._id]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const isNew = product === null;
  const mainImage = draft.images.find((image) => image.isMain && image.url) || draft.images.find((image) => image.url);

  function setField(key, value) {
    setDraft((current) => Object.assign({}, current, { [key]: value }));
  }

  // Imágenes
  function updateImage(index, key, value) {
    setDraft((current) => Object.assign({}, current, {
      images: current.images.map((image, position) => (position === index ? Object.assign({}, image, { [key]: value }) : image))
    }));
  }

  function setMainImage(index) {
    setDraft((current) => Object.assign({}, current, {
      images: current.images.map((image, position) => Object.assign({}, image, { isMain: position === index }))
    }));
  }

  function addImage() {
    setDraft((current) => {
      if (current.images.length >= MAX_IMAGES) return current;
      const first = current.images.length === 0;
      return Object.assign({}, current, {
        images: current.images.concat([{ url: "", alt: "", isMain: first }])
      });
    });
  }

  function removeImage(index) {
    setDraft((current) => {
      const remaining = current.images.filter((_, position) => position !== index);
      const hasMain = remaining.some((image) => image.isMain);
      const images = remaining.map((image, position) => Object.assign({}, image, {
        isMain: hasMain ? image.isMain : position === 0
      }));
      return Object.assign({}, current, { images });
    });
  }

  // Características
  function updateSpec(index, key, value) {
    setDraft((current) => Object.assign({}, current, {
      specs: current.specs.map((spec, position) => (position === index ? Object.assign({}, spec, { [key]: value }) : spec))
    }));
  }

  function addSpec() {
    setDraft((current) => {
      if (current.specs.length >= MAX_SPECS) return current;
      return Object.assign({}, current, { specs: current.specs.concat([{ label: "", value: "" }]) });
    });
  }

  function removeSpec(index) {
    setDraft((current) => Object.assign({}, current, {
      specs: current.specs.filter((_, position) => position !== index)
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (draft.work === "") {
      setError("Selecciona una obra antes de guardar.");
      return;
    }
    setSending(true);
    setError("");
    try {
      if (isNew) {
        await apiPost("/admin/products", draft);
      } else {
        await apiPut(`/admin/products/${product._id}`, draft);
      }
      onSaved();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h2>{isNew ? "Nueva pieza" : `Editar: ${product.name}`}</h2>
      {categoriesState && categoriesState.status === "error" ? (
        <p className="status status--error" role="alert">No pudimos cargar las categorías. <button className="link-button" type="button" onClick={categoriesState.reload}>Reintentar</button></p>
      ) : null}

      <section className="admin-form__section" aria-labelledby="product-base-title">
        <header className="admin-form__section-head"><div><p className="micro">01 · Información principal</p><h3 id="product-base-title">Identidad y catálogo</h3></div><p>Datos que permiten encontrar la pieza y relacionarla con su obra.</p></header>
        <div className="admin-grid">
        <label className="field">
          Nombre
          <input value={draft.name} onChange={(event) => setField("name", event.target.value)} required />
        </label>
        <label className="field">
          Enlace (slug)
          <input
            value={draft.slug}
            placeholder="Se genera a partir del nombre"
            onChange={(event) => setField("slug", event.target.value)}
          />
        </label>
        <label className="field">
          Categoría
          <select className="admin-select" aria-label="Categoría de la pieza" value={draft.category} onChange={(event) => setField("category", event.target.value)} disabled={!categoriesReady || categoryChoices.length === 0}>
            <option value="" disabled>{!categoriesReady ? "Cargando categorías…" : categoryChoices.length === 0 ? "No hay categorías disponibles" : "Selecciona una categoría"}</option>
            {categoryChoices.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}{category.active === false ? " · desactivada" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Obra
          <select
            value={draft.work}
            onChange={(event) => setField("work", event.target.value)}
            required
            disabled={worksReady === false}
          >
            <option value="">{worksReady ? "Selecciona una obra" : "Cargando obras…"}</option>
            {works.map((work) => (
              <option key={work._id} value={work._id}>{work.title}</option>
            ))}
          </select>
          {worksState.status === "loading" ? <span className="status">Cargando obras…</span> : null}
          {worksState.status === "error" ? (
            <span className="status status--error" role="alert">
              No pudimos cargar las obras. <button className="link-button" type="button" onClick={worksState.reload}>Reintentar</button>
            </span>
          ) : null}
        </label>
        <label className="field">
          Precio (USD, vacío = consultar)
          <input
            type="number"
            min="0"
            step="0.01"
            value={draft.price}
            onChange={(event) => setField("price", event.target.value)}
          />
        </label>
        <label className="field">
          Stock
          <input
            type="number"
            min="0"
            step="1"
            value={draft.stock}
            onChange={(event) => setField("stock", event.target.value)}
          />
        </label>
        <label className="field">
          Disponibilidad
          <select value={draft.availability} onChange={(event) => setField("availability", event.target.value)}>
            {AVAILABILITY_CHOICES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="field field--check">
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(event) => setField("featured", event.target.checked)}
          />
          Destacada en el hero
        </label>
        <label className="field field--check">
          <input
            type="checkbox"
            checked={draft.recommended}
            onChange={(event) => setField("recommended", event.target.checked)}
          />
          Recomendación editorial
        </label>
        {draft.featured ? <label className="field">Orden en el Hero<input type="number" min="0" max="9999" step="1" value={draft.featuredOrder} onChange={(event) => setField("featuredOrder", Number(event.target.value))} /><span className="status">Un número menor aparece antes. Si coinciden, se usa la fecha de edición.</span></label> : null}
        {draft.recommended ? <label className="field">Orden en recomendaciones<input type="number" min="0" max="9999" step="1" value={draft.recommendedOrder} onChange={(event) => setField("recommendedOrder", Number(event.target.value))} /><span className="status">Un número menor aparece antes. Si coinciden, se usa la fecha de edición.</span></label> : null}
        </div>
      </section>

      <section className="admin-form__section" aria-labelledby="product-editorial-title">
        <header className="admin-form__section-head"><div><p className="micro">02 · Contenido</p><h3 id="product-editorial-title">Descripción y contexto</h3></div><p>Explica lo necesario y, cuando haya una conexión concreta que aportar, compártela sin inventar significados.</p></header>
      <label className="field">
        Descripción
        <textarea rows="3" value={draft.description} onChange={(event) => setField("description", event.target.value)} />
      </label>

      <label className="field">
        Ficha contextual (opcional, máximo 1200 caracteres)
        <textarea rows="4" maxLength="1200" value={draft.contexto} onChange={(event) => setField("contexto", event.target.value)} />
      </label>

      </section>

      <section className="admin-form__section" aria-labelledby="product-images-title">
        <header className="admin-form__section-head"><div><p className="micro">03 · Apariencia</p><h3 id="product-images-title">Imágenes del producto</h3></div><p>La imagen principal se usa en tarjetas, portada, detalle y carrito.</p></header>
        {mainImage ? <div className="admin-form__image-preview"><img src={mainImage.url} alt={mainImage.alt || `Vista previa de ${draft.name || "la pieza"}`} /><p><strong>Vista previa principal</strong>{mainImage.alt || "Sin texto alternativo"}</p></div> : <p className="status">Añade una imagen para ver la vista previa.</p>}
      <fieldset className="admin-fieldset">
        <legend>Galería (máximo {MAX_IMAGES} imágenes)</legend>
        <p className="status">Usa una URL pública o una ruta local dentro de /assets/. Los recursos de muestra del proyecto también se pueden conservar al editar la pieza.</p>
        {draft.images.map((image, index) => (
          <div className="admin-row" key={index}>
            <input
              type="text"
              placeholder="https://… o /assets/…"
              value={image.url}
              aria-label={`URL o ruta pública de la imagen ${index + 1}`}
              onChange={(event) => updateImage(index, "url", event.target.value)}
            />
            <input
              placeholder="Texto alternativo"
              value={image.alt}
              aria-label={`Texto alternativo de la imagen ${index + 1}`}
              onChange={(event) => updateImage(index, "alt", event.target.value)}
            />
            <label className="field field--check">
              <input type="radio" name="main-image" checked={image.isMain} onChange={() => setMainImage(index)} />
              Principal
            </label>
            <button type="button" className="link-button link-button--danger" onClick={() => removeImage(index)}>Quitar</button>
          </div>
        ))}
        {draft.images.length < MAX_IMAGES ? (
          <button type="button" className="btn-ghost" onClick={addImage}>Añadir imagen</button>
        ) : null}
      </fieldset>
      </section>

      <section className="admin-form__section" aria-labelledby="product-specs-title">
        <header className="admin-form__section-head"><div><p className="micro">04 · Información adicional</p><h3 id="product-specs-title">Características</h3></div><p>Medidas, materiales u otros detalles útiles para decidir.</p></header>
      <fieldset className="admin-fieldset">
        <legend>Características (opcional, máximo {MAX_SPECS})</legend>
        {draft.specs.map((spec, index) => (
          <div className="admin-row admin-row--spec" key={index}>
            <input
              placeholder="Nombre, por ejemplo Medidas"
              value={spec.label}
              aria-label={`Nombre de la característica ${index + 1}`}
              onChange={(event) => updateSpec(index, "label", event.target.value)}
            />
            <input
              placeholder="Valor, por ejemplo 3 cm"
              value={spec.value}
              aria-label={`Valor de la característica ${index + 1}`}
              onChange={(event) => updateSpec(index, "value", event.target.value)}
            />
            <button type="button" className="link-button link-button--danger" onClick={() => removeSpec(index)}>Quitar</button>
          </div>
        ))}
        {draft.specs.length < MAX_SPECS ? (
          <button type="button" className="btn-ghost" onClick={addSpec}>Añadir característica</button>
        ) : null}
      </fieldset>
      </section>

      <div className="form-foot">
        <button className="button" type="submit" disabled={sending || worksReady === false || categoriesReady === false || categoryChoices.length === 0}>
          {sending ? "Guardando…" : "Guardar pieza"}
        </button>
        <button className="btn-ghost" type="button" onClick={onCancel}>Cancelar</button>
        <p className="status status--error" role="alert">{error}</p>
      </div>
    </form>
  );
}
