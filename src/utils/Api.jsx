import axios from "axios";

const API_BASE_URL = "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor to add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  signup: async (userData) => {
    try {
      const response = await api.post("/auth/signup", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

export const transporterAPI = {
  // Create transporter details - Updated to match Express routes
  createTransporter: async (requestId, transporterData) => {
    try {
      const response = await api.post(
        `/transport-requests/${requestId}/transporter`,
        transporterData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update transporter details - Updated to match Express routes
  updateTransporter: async (transporterId, transporterData) => {
    try {
      const response = await api.put(
        `/transporter/${transporterId}`,
        transporterData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get transporter details by transport request ID - Updated to match Express routes
  getTransporterByRequestId: async (requestId) => {
    try {
      const response = await api.get(
        `/transport-requests/${requestId}/transporter`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all transporter details (admin only) - New method
  getAllTransporters: async () => {
    try {
      const response = await api.get("/transporter");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export const transportRequestAPI = {
  // Create transport request
  createRequest: async (requestData) => {
    try {
      const response = await api.post("/transport/create", requestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update transport request
  updateRequest: async (requestId, requestData) => {
    try {
      const response = await api.put(
        `/transport/update/${requestId}`,
        requestData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get customer requests
  getCustomerRequests: async () => {
    try {
      const response = await api.get("/transport/customer-requests");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all requests (admin)
  getAllRequests: async () => {
    try {
      const response = await api.get("/transport/all-requests");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update request status (admin)
  updateRequestStatus: async (requestId, status, adminComment) => {
    try {
      const response = await api.put(`/transport/status/${requestId}`, {
        status,
        adminComment,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
};

export default api;
