// components/cuenta/LoginAttemptsNotice.jsx
// Muestra intentos restantes o la cuenta regresiva del bloqueo. El tiempo lo define el servidor
// (retryAfterSeconds); el contador visual no sustituye ninguna restricción del backend.
import { useEffect, useState } from "react";

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function LoginAttemptsNotice({ remainingAttempts, retryAfterSeconds }) {
  const [secondsLeft, setSecondsLeft] = useState(retryAfterSeconds || 0);

  // Cada bloqueo nuevo reinicia la cuenta regresiva con el valor que envía el servidor.
  useEffect(() => {
    setSecondsLeft(retryAfterSeconds || 0);
  }, [retryAfterSeconds]);

  // Descuenta un segundo por vez mientras haya bloqueo activo.
  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft > 0]);

  if (secondsLeft > 0) {
    return (
      <p className="status status--error" role="alert">
        Demasiados intentos. Puedes volver a intentarlo en {formatTime(secondsLeft)}.
      </p>
    );
  }

  if (typeof remainingAttempts === "number" && remainingAttempts > 0) {
    return (
      <p className="status" role="status">
        Te quedan {remainingAttempts} {remainingAttempts === 1 ? "intento" : "intentos"} antes de un bloqueo temporal.
      </p>
    );
  }

  if (typeof remainingAttempts === "number" && remainingAttempts === 0) {
    return (
      <p className="status status--error" role="alert">
        Este era tu último intento. Si vuelves a fallar, la cuenta quedará bloqueada temporalmente.
      </p>
    );
  }

  return null;
}
