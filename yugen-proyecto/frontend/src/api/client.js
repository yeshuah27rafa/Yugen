// api/client.js
// Única puerta de salida del frontend hacia la API.
// Dos sesiones independientes: administración y cliente. Cada una con su token CSRF, guardado solo en memoria.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

let adminCsrf = "";
let customerCsrf = "";

export function setCsrfToken(token) {
  adminCsrf = token || "";
}

export function setCustomerCsrfToken(token) {
  customerCsrf = token || "";
}

// Envía la petición. Los errores incluyen el código HTTP y el cuerpo de la respuesta (intentos restantes, espera).
async function apiRequest(path, method, body, csrf) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET" && csrf !== "") headers["X-CSRF-Token"] = csrf;

  let response;
  try {
    response = await fetch(API_URL + path, {
      method,
      credentials: "include",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (networkError) {
    const error = new Error("No pudimos conectar con el servidor. Intenta de nuevo en un momento.");
    error.status = 0;
    error.data = {};
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  if (response.ok === false) {
    const error = new Error(data.error || "No pudimos completar la solicitud.");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

// Rutas de administración y públicas: usan el token de administración en escrituras.
export function apiGet(path) {
  return apiRequest(path, "GET", undefined, adminCsrf);
}

export function apiPost(path, body) {
  return apiRequest(path, "POST", body, adminCsrf);
}

export function apiPut(path, body) {
  return apiRequest(path, "PUT", body, adminCsrf);
}

export function apiDelete(path) {
  return apiRequest(path, "DELETE", undefined, adminCsrf);
}

// Rutas de cliente: usan el token de cliente.
export function clienteGet(path) {
  return apiRequest(path, "GET", undefined, customerCsrf);
}

export function clientePut(path, body) {
  return apiRequest(path, "PUT", body, customerCsrf);
}

export function clientePost(path, body) {
  return apiRequest(path, "POST", body, customerCsrf);
}
