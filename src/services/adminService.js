import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add auth token to requests
apiClient.interceptors.request.use(
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

const adminService = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await apiClient.get("/api/admin/users");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add more admin-related API calls as needed
};

export default adminService;