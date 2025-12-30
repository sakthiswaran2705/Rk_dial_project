const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

let isRefreshing = false;
let refreshPromise = null;
let isLoggingOut = false;

// ===== REFRESH ACCESS TOKEN =====
async function refreshAccessToken() {
  if (isRefreshing) return refreshPromise;

  isRefreshing = true;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("REFRESH_TOKEN");
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${BACKEND_URL}/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await res.json();

      if (res.ok && data?.status === true && data?.access_token) {
        localStorage.setItem("ACCESS_TOKEN", data.access_token);
        return data.access_token;
      }
      return null;
    } catch {
      return null;
    }
  })();

  const token = await refreshPromise;

  isRefreshing = false;
  refreshPromise = null;

  return token;
}

// ===== AUTH FETCH =====
export const authenticatedFetch = async (endpoint, options = {}) => {
  let accessToken = localStorage.getItem("ACCESS_TOKEN");

  let res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: accessToken ? `Bearer ${accessToken}` : "",
    },
  });

  if (res.status === 401) {
    const newAccess = await refreshAccessToken();

    if (!newAccess) {
      if (!isLoggingOut) {
        isLoggingOut = true;
        localStorage.clear();
        sessionStorage.clear();
        alert("Session expired. Please login again.");
        window.location.href = "/login";
      }
      throw new Error("Session expired");
    }

    res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${newAccess}`,
      },
    });
  }

  return res;
};
