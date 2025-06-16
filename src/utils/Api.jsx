import axios from "axios";

// Use environment variable with fallback to localhost
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Variable to track if we're already handling an auth error to prevent infinite loops
let isHandlingAuthError = false;

// Add interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    // Reset auth error handling flag on successful responses
    isHandlingAuthError = false;
    return response;
  },
  (error) => {
    // Handle authentication errors (401 Unauthorized, 403 Forbidden)
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !isHandlingAuthError
    ) {
      isHandlingAuthError = true;

      // Clear authentication data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Show error message
      console.error("Authentication failed - redirecting to login");
      
      // Use setTimeout to delay the redirect slightly, giving time for any toast messages to appear
      setTimeout(() => {
        // Redirect to login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }, 1500); // 1.5 second delay
    }

    return Promise.reject(error);
  }
);

// Utility function to check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    // Decode JWT token to check expiration
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;

    // Add 30 second buffer to account for network delays
    return payload.exp < currentTime + 30;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true; // Treat invalid tokens as expired
  }
};

// Function to validate token format
export const isValidTokenFormat = (token) => {
  if (!token) return false;

  // JWT tokens have 3 parts separated by dots
  const parts = token.split(".");
  return parts.length === 3;
};

// Function to clear authentication data
export const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  delete api.defaults.headers.common["Authorization"];
};

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

  // Add token validation endpoint
  validateToken: async () => {
    try {
      const response = await api.get("/auth/validate");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add refresh token endpoint (if your backend supports it)
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post("/auth/refresh", { refreshToken });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout: () => {
    clearAuthData();
  },

  // Check if current session is valid
  checkSession: async () => {
    const token = localStorage.getItem("token");

    // Check if token exists and has valid format
    if (!token || !isValidTokenFormat(token)) {
      return false;
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      clearAuthData();
      return false;
    }

    try {
      // Validate with server
      await authAPI.validateToken();
      return true;
    } catch (error) {
      console.error("Session validation failed:", error);
      clearAuthData();
      return false;
    }
  },
};

// NEW: User Management API following the same pattern as transporterAPI
export const userAPI = {
  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      const response = await api.get("/users/allusers");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user details
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user role (admin only)
  updateUserRole: async (userId, roleData) => {
    try {
      const response = await api.put(`/users/${userId}/role`, roleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new user (admin only)
  createUser: async (userData) => {
    try {
      const response = await api.post("/users/create", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
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
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
  }
};

export { api };

export default api;

export const transporterListAPI = {
  getAllTransporters: async () => {
    try {
      const response = await api.get("/transporterlist/getall");
      return response.data; // Return direct data since it's already in correct format
    } catch (error) {
      console.error("Error fetching transporters:", error);
      return [];
    }
  },
};

export const servicesAPI = {
  getAllServices: async () => {
    try {
      const response = await api.get("/services/getallservices");
      return response.data;
    } catch (error) {
      console.error("Error fetching services:", error);
      throw error;
    }
  },

  // Add new method for creating service
  createService: async (serviceData) => {
    try {
      const response = await api.post("/services/services", serviceData);
      return response.data;
    } catch (error) {
      console.error("Error creating service:", error);
      throw error;
    }
  },
};
