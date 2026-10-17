
const API_URL = "http://localhost:5000/api";

export async function apiRequest(endpoint, options = {}) {
  const token = sessionStorage.getItem("freshmartToken");

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      "Cannot connect to FreshMart server. Check that the backend is running on port 5000."
    );
  }

  const contentType = response.headers.get("content-type") || "";
  let data = {};

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => ({}));
  } else {
    const text = await response.text().catch(() => "");
    data = text ? { message: text } : {};
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        data.message || "Your session expired. Please log in again."
      );
    }

    if (response.status === 403) {
      throw new Error(
        data.message || "You do not have permission to perform this action."
      );
    }

    throw new Error(
      data.message || `Request failed with status ${response.status}.`
    );
  }

  return data;
}
