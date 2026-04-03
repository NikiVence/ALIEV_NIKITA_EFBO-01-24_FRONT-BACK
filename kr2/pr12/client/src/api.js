const API_URL = "http://localhost:3001/api";

export function saveTokens(accessToken, refreshToken) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

export function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export async function registerUser(userData) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  return res;
}

export async function loginUser(userData) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  return res;
}

export async function refreshTokenRequest() {
  const refreshToken = getRefreshToken();

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-refresh-token": refreshToken,
    },
  });

  return res;
}

export async function getCurrentUser() {
  let accessToken = getAccessToken();

  let res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    const refreshRes = await refreshTokenRequest();

    if (refreshRes.ok) {
      const tokens = await refreshRes.json();
      saveTokens(tokens.accessToken, tokens.refreshToken);

      accessToken = tokens.accessToken;

      res = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } else {
      logout();
    }
  }

  return res;
}

export async function getProducts() {
  let accessToken = getAccessToken();

  let res = await fetch(`${API_URL}/products`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    const refreshRes = await refreshTokenRequest();

    if (refreshRes.ok) {
      const tokens = await refreshRes.json();
      saveTokens(tokens.accessToken, tokens.refreshToken);

      accessToken = tokens.accessToken;

      res = await fetch(`${API_URL}/products`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } else {
      logout();
    }
  }

  return res;
}

export async function getProductById(id) {
  let accessToken = getAccessToken();

  let res = await fetch(`${API_URL}/products/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    const refreshRes = await refreshTokenRequest();

    if (refreshRes.ok) {
      const tokens = await refreshRes.json();
      saveTokens(tokens.accessToken, tokens.refreshToken);

      accessToken = tokens.accessToken;

      res = await fetch(`${API_URL}/products/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } else {
      logout();
    }
  }

  return res;
}

export async function createProduct(productData) {
  let accessToken = getAccessToken();

  let res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(productData),
  });

  if (res.status === 401) {
    const refreshRes = await refreshTokenRequest();

    if (refreshRes.ok) {
      const tokens = await refreshRes.json();
      saveTokens(tokens.accessToken, tokens.refreshToken);

      accessToken = tokens.accessToken;

      res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(productData),
      });
    } else {
      logout();
    }
  }

  return res;
}

export async function updateProduct(id, productData) {
  let accessToken = getAccessToken();

  let res = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(productData),
  });

  if (res.status === 401) {
    const refreshRes = await refreshTokenRequest();

    if (refreshRes.ok) {
      const tokens = await refreshRes.json();
      saveTokens(tokens.accessToken, tokens.refreshToken);

      accessToken = tokens.accessToken;

      res = await fetch(`${API_URL}/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(productData),
      });
    } else {
      logout();
    }
  }

  return res;
}

export async function deleteProduct(id) {
  let accessToken = getAccessToken();

  let res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    const refreshRes = await refreshTokenRequest();

    if (refreshRes.ok) {
      const tokens = await refreshRes.json();
      saveTokens(tokens.accessToken, tokens.refreshToken);

      accessToken = tokens.accessToken;

      res = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } else {
      logout();
    }
  }

  return res;
}

export async function getUsers() {
  let accessToken = getAccessToken();

  let res = await fetch(`${API_URL}/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    const refreshRes = await refreshTokenRequest();

    if (refreshRes.ok) {
      const tokens = await refreshRes.json();
      saveTokens(tokens.accessToken, tokens.refreshToken);

      accessToken = tokens.accessToken;

      res = await fetch(`${API_URL}/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } else {
      logout();
    }
  }

  return res;
}

export async function getUserById(id) {
  let accessToken = getAccessToken();

  let res = await fetch(`${API_URL}/users/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    const refreshRes = await refreshTokenRequest();

    if (refreshRes.ok) {
      const tokens = await refreshRes.json();
      saveTokens(tokens.accessToken, tokens.refreshToken);

      accessToken = tokens.accessToken;

      res = await fetch(`${API_URL}/users/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } else {
      logout();
    }
  }

  return res;
}

export async function updateUser(id, userData) {
  let accessToken = getAccessToken();

  let res = await fetch(`${API_URL}/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(userData),
  });

  if (res.status === 401) {
    const refreshRes = await refreshTokenRequest();

    if (refreshRes.ok) {
      const tokens = await refreshRes.json();
      saveTokens(tokens.accessToken, tokens.refreshToken);

      accessToken = tokens.accessToken;

      res = await fetch(`${API_URL}/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(userData),
      });
    } else {
      logout();
    }
  }

  return res;
}

export async function blockUser(id) {
  let accessToken = getAccessToken();

  let res = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    const refreshRes = await refreshTokenRequest();

    if (refreshRes.ok) {
      const tokens = await refreshRes.json();
      saveTokens(tokens.accessToken, tokens.refreshToken);

      accessToken = tokens.accessToken;

      res = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } else {
      logout();
    }
  }

  return res;
}

export async function unblockUser(id) {
  let accessToken = getAccessToken();

  let res = await fetch(`${API_URL}/users/${id}/unblock`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    const refreshRes = await refreshTokenRequest();

    if (refreshRes.ok) {
      const tokens = await refreshRes.json();
      saveTokens(tokens.accessToken, tokens.refreshToken);

      accessToken = tokens.accessToken;

      res = await fetch(`${API_URL}/users/${id}/unblock`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } else {
      logout();
    }
  }

  return res;
}