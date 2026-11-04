// api/client.js
// Única puerta de salida del frontend hacia la API.
// La sesión viaja en una cookie httpOnly (credentials: include). El token CSRF se guarda solo en memoria.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

let csrfToken = "";

export function setCsrfToken(token) {
  csrfToken = token || "";
}

async function apiRequest(path, method, body) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET" && csrfToken !== "") headers["X-CSRF-Token"] = csrfToken;

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
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  if (response.ok === false) {
    const error = new Error(data.error || "No pudimos completar la solicitud.");
    error.status = response.status;
    throw error;
  }
  return data;
}

export function apiGet(path) {
  return apiRequest(path, "GET");
}

export function apiPost(path, body) {
  return apiRequest(path, "POST", body);
}

export function apiPut(path, body) {
  return apiRequest(path, "PUT", body);
}

export function apiDelete(path) {
  return apiRequest(path, "DELETE");
}
