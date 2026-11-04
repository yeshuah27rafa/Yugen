// components/admin/ProductForm.jsx
// Formulario de alta y edición: datos, precio opcional, disponibilidad, imágenes, características y ficha.
import { useState } from "react";
import { apiPost, apiPut } from "../../api/client.js";
import { categoryLabel } from "../../utils/format.js";

const MAX_IMAGES = 8;
const MAX_SPECS = 10;
const CATEGORY_CHOICES = ["pin", "manga", "figura", "mousepad", "otro"];
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
      availability: "en_stock", description: "", contexto: "", featured: false,
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
    images: product.images.map((image) => ({ url: image.url, alt: image.alt || "", isMain: image.isMain === true })),
    specs: product.specs.map((spec) => ({ label: spec.label, value: spec.value }))
  };
}

export default function ProductForm({ product, works, onSaved, onCancel }) {
  const [draft, setDraft] = useState(() => toDraft(product));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const isNew = product === null;

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
          <select value={draft.category} onChange={(event) => setField("category", event.target.value)}>
            {CATEGORY_CHOICES.map((value) => (
              <option key={value} value={value}>{categoryLabel(value)}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Obra
          <select value={draft.work} onChange={(event) => setField("work", event.target.value)} required>
            <option value="">Selecciona una obra</option>
            {works.map((work) => (
              <option key={work._id} value={work._id}>{work.title}</option>
            ))}
          </select>
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
          Destacada en la portada
        </label>
      </div>

      <label className="field">
        Descripción
        <textarea rows="3" value={draft.description} onChange={(event) => setField("description", event.target.value)} />
      </label>

      <label className="field">
        Ficha contextual (opcional, máximo 1200 caracteres)
        <textarea rows="4" maxLength="1200" value={draft.contexto} onChange={(event) => setField("contexto", event.target.value)} />
      </label>

      <fieldset className="admin-fieldset">
        <legend>Imágenes (la marcada como principal aparece en tarjetas y portada)</legend>
        {draft.images.map((image, index) => (
          <div className="admin-row" key={index}>
            <input
              type="url"
              placeholder="https://…"
              value={image.url}
              aria-label={`URL de la imagen ${index + 1}`}
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

      <fieldset className="admin-fieldset">
        <legend>Características (opcional)</legend>
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

      <div className="form-foot">
        <button className="button" type="submit" disabled={sending}>
          {sending ? "Guardando…" : "Guardar pieza"}
        </button>
        <button className="btn-ghost" type="button" onClick={onCancel}>Cancelar</button>
        <p className="status status--error" role="alert">{error}</p>
      </div>
    </form>
  );
}
