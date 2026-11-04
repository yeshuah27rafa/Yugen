// hooks/useApi.js
// Pide datos a la API y expone estado de carga, error (con código HTTP), datos y una función para recargar.
import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../api/client.js";

export function useApi(path) {
  const [state, setState] = useState({ status: "loading", data: null, error: "", httpStatus: 0 });
  const [version, setVersion] = useState(0);

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
  }, [path, version]);

  const reload = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  return Object.assign({}, state, { reload });
}
