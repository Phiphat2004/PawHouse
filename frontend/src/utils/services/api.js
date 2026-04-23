
const API_BASE = "/api";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem("pawhouse_token");

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Handle query params
  let fullUrl = url;
  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    fullUrl = `${url}?${searchParams.toString()}`;
  }

  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMessage = "Request failed";
    try {
      const data = await res.json();
      errorMessage = data.error || data.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    }
    const error = new Error(errorMessage);
    error.status = res.status;
    throw error;
  }

  return await res.json();
}

export const api = {
  get: (endpoint, options) => request(endpoint, options),
  post: (endpoint, body) =>
    request(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body) =>
    request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  putForm: (endpoint, formData) =>
    request(endpoint, { method: "PUT", body: formData, headers: {} }),
  patch: (endpoint, body) =>
    request(endpoint, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: (endpoint, options = {}) =>
    request(endpoint, { method: "DELETE", ...options }),
};

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  verifyOtp: (data) => api.post("/auth/verify-otp", data),
  resendOtp: (data) => api.post("/auth/resend-otp", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  updateProfile: (data) => {
    if (data instanceof FormData) {
      return api.putForm("/auth/profile", data);
    }
    return api.put("/auth/profile", data);
  },
  logout: () => api.post("/auth/logout"),
  logoutAll: () => api.post("/auth/logout", { logoutAllDevices: true }),
  getActiveSessions: () => api.get("/auth/sessions"),
  revokeSession: (sessionId) => api.delete(`/auth/sessions/${sessionId}`),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  verifyResetOtp: (data) => api.post("/auth/verify-reset-otp", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  changePassword: (data) => api.put("/auth/change-password", data), 
  deleteMe: () => api.delete("/users/me"),
  googleAuth: (data) => api.post("/auth/google/auth", data),           // Recommended
  googleRegister: (data) => api.post("/auth/google/register", data),  // Legacy
  googleLogin: (data) => api.post("/auth/google/login", data),        // Legacy
};

export const productApi = {
  getAll: () => api.get("/products"),
  getById: (id) => api.get(`/products/${id}`),
  getBySlug: (slug) => api.get(`/products/slug/${slug}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get("/categories"),
};

export const categoryApi = {
  getAll: () => api.get("/categories"),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const postApi = {
  getAll: () => api.get("/posts"),
  getPublic: () => api.get("/posts/public"),
  getById: (id) => api.get(`/posts/${id}`),
  getBySlug: (slug) => api.get(`/posts/slug/${slug}`),
  create: (data) => api.post("/posts", data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  toggleStatus: (id) => api.put(`/posts/${id}/toggle-status`, {}),

  // User's own posts
  getMyPosts: (params) => api.get("/posts/my-posts", { params }),
  updateMyPost: (id, data) => api.put(`/posts/my-posts/${id}`, data),
  deleteMyPost: (id) => api.delete(`/posts/my-posts/${id}`),
};

export const cartApi = {
  addToCart: (data) => api.post("/cart/add", data),
  getCart: () => api.get("/cart"),
  updateQuantity: (itemId, quantity) => api.put(`/cart/${itemId}`, { quantity }),
  removeItem: (product_id) => api.delete("/cart", { body: JSON.stringify({ product_id }) }),
  clearCart: () => api.delete("/cart/clear"),
};

export const orderApi = {
  createOrder: (data) => api.post("/orders/create", data),
  getMyOrders: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/orders/my${queryParams ? `?${queryParams}` : ''}`);
  },
  getOrderDetail: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.patch(`/orders/${id}/cancel`),
  // Admin only
  getAllOrders: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/orders${queryParams ? `?${queryParams}` : ''}`);
  },
  searchOrders: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/orders/search${queryParams ? `?${queryParams}` : ''}`);
  },
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  filterOrders: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/orders/filter${queryParams ? `?${queryParams}` : ''}`);
  },
  exportBill: (id) => api.get(`/orders/${id}/export`),
};

export default api;
