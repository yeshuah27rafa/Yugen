// hooks/useApi.js
// Pide datos a la API y expone estado de carga, error (con código HTTP) y datos.
// Ignora respuestas viejas si cambia la ruta.
import { useEffect, useState } from "react";
import { apiGet } from "../api/client.js";

export function useApi(path) {
  const [state, setState] = useState({ status: "loading", data: null, error: "", httpStatus: 0 });

  useEffect(() => {
    let active = true;
    setState({ status: "loading", data: null, error: "", httpStatus: 0 });
    apiGet(path)
      .then((data) => {
        if (active) setState({ status: "ready", data, error: "", httpStatus: 200 });
      })
      .catch((error) => {
        if (active) setState({ status: "error", data: null, error: error.message, httpStatus: error.status || 0 });
      });
    return () => {
      active = false;
    };
  }, [path]);

  return state;
}
