// Campo de contraseña con control de visibilidad accesible y consistente entre navegadores.
import { useId, useState } from "react";

export default function PasswordField({ id, className = "", ...props }) {
  const generatedId = useId();
  const inputId = id || `password-${generatedId}`;
  const [visible, setVisible] = useState(false);

  return (
    <span className="password-field">
      <input
        {...props}
        id={inputId}
        className={`password-field__input${className ? ` ${className}` : ""}`}
        type={visible ? "text" : "password"}
      />
      <button
        className="password-field__toggle"
        type="button"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-controls={inputId}
        aria-pressed={visible}
        title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7" />
            <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 8.7 4.4 9.8 6.4a1.3 1.3 0 010 1.2 16 16 0 01-3.1 3.8M6.2 6.2A16 16 0 002.2 11.4a1.3 1.3 0 000 1.2C3.3 14.6 6.8 19 12 19a10 10 0 004-.8" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M2.2 12s3.5-6.4 9.8-6.4 9.8 6.4 9.8 6.4-3.5 6.4-9.8 6.4S2.2 12 2.2 12z" />
            <circle cx="12" cy="12" r="2.7" />
          </svg>
        )}
      </button>
    </span>
  );
}
