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
    const filteredParams = Object.fromEntries(
      Object.entries(options.params).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      ),
    );
    const searchParams = new URLSearchParams(filteredParams);
    fullUrl = `${url}?${searchParams.toString()}`;
  }

  const res = await fetch(fullUrl, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    let errorMessage = "Request failed";
    try {
      const data = await res.json();
      errorMessage =
        data.error ||
        data.message ||
        (Array.isArray(data.errors) && data.errors.length > 0
          ? data.errors[0].msg
          : errorMessage);
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
  postForm: (endpoint, formData) =>
    request(endpoint, { method: "POST", body: formData, headers: {} }),
  put: (endpoint, body) =>
    request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  putForm: (endpoint, formData) =>
    request(endpoint, { method: "PUT", body: formData, headers: {} }),
  patch: (endpoint, body) =>
    request(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
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
  googleAuth: (data) => api.post("/auth/google/auth", data), // NEW - Recommended
  googleRegister: (data) => api.post("/auth/google/register", data), // Legacy
  googleLogin: (data) => api.post("/auth/google/login", data), // Legacy
};

export const productApi = {
  getAll: () => api.get("/products"),
  getById: (id) => api.get(`/products/${id}`),
  getBySlug: (slug) => api.get(`/products/slug/${slug}`),
  create: (data) => {
    if (data instanceof FormData)
      return request("/products", { method: "POST", body: data });
    return api.post("/products", data);
  },
  update: (id, data) => {
    if (data instanceof FormData)
      return request(`/products/${id}`, { method: "PUT", body: data });
    return api.put(`/products/${id}`, data);
  },
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
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.postForm("/posts/upload", formData);
  },

  // User's own posts
  getMyPosts: (params) => api.get("/posts/my-posts", { params }),
  updateMyPost: (id, data) => api.put(`/posts/my-posts/${id}`, data),
  deleteMyPost: (id) => api.delete(`/posts/my-posts/${id}`),
};

export const cartApi = {
  addToCart: (data) => api.post("/cart/add", data),
  getCart: () => api.get("/cart"),
  updateQuantity: (itemId, quantity) =>
    api.put(`/cart/${itemId}`, { quantity }),
  removeItem: (product_id) =>
    api.delete("/cart", { body: JSON.stringify({ product_id }) }),
  clearCart: () => api.delete("/cart/clear"),
};

export const orderApi = {
  createOrder: (data) => api.post("/orders", data),
  getMyOrders: (params = {}) => api.get("/orders", { params }),
  getOrderDetail: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, reason) =>
    api.delete(`/orders/${id}`, {
      body: reason ? JSON.stringify({ reason }) : undefined,
    }),
  markPaymentAsPaid: (orderId) =>
    api.patch(`/payments/order/${orderId}/mark-paid`),
  getPaymentByOrder: (orderId) => api.get(`/payments/order/${orderId}`),
  // Admin only
  getDashboardStats: () => api.get("/orders/dashboard-stats"),
  getAllOrders: (params = {}) =>
    api.get("/orders", { params: { ...params, all: true } }),
  searchOrders: (params = {}) => api.get("/orders", { params }),
  updateOrderStatus: (id, status, note) =>
    api.patch(`/orders/${id}/status`, { status, note }),
  filterOrders: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/orders/filter${queryParams ? `?${queryParams}` : ""}`);
  },
  exportBill: (id) => api.get(`/orders/${id}/export`),
};

export const stockApi = {
  // Stock entries
  createEntry: (data) => api.post("/stock/entry", data),

  // Stock levels
  getStockLevels: (params) => api.get("/stock/levels", { params }),

  // Stock movements
  getMovements: (params) => api.get("/stock/movements", { params }),
  deleteMovement: (id) => api.delete(`/stock/movements/${id}`),

  // Product stock
  getProductStock: (productId) => api.get(`/stock/product/${productId}`),

  // Warehouses
  getWarehouses: () => api.get("/stock/warehouses"),
  createWarehouse: (data) => api.post("/stock/warehouses", data),
  deleteWarehouse: (id) => api.delete(`/stock/warehouses/${id}`),
};

export const careAppointmentApi = {
  createAppointment: (data) => api.post("/care-appointments", data),
  getMyAppointments: (params = {}) =>
    api.get("/care-appointments/my", { params }),
  getMyAppointmentById: (id) => api.get(`/care-appointments/my/${id}`),
  updateAppointment: (id, data) => api.patch(`/care-appointments/${id}`, data),
  rescheduleAppointment: (id, data) =>
    api.patch(`/care-appointments/${id}/reschedule`, data),
  cancelAppointment: (id, reason) =>
    api.patch(`/care-appointments/${id}/cancel`, { reason }),
  getAllAppointments: (params = {}) =>
    api.get("/care-appointments", { params }),
  approveAppointment: (id) => api.patch(`/care-appointments/${id}/approve`),
  rejectAppointment: (id, reason = "") =>
    api.patch(`/care-appointments/${id}/reject`, { reason }),
  updateAppointmentStatus: (id, status) =>
    api.patch(`/care-appointments/${id}/status`, { status }),
};

export default api;
