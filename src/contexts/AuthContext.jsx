import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { authAPI, setAuthToken } from "../utils/Api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on component mount
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setAuthToken(token);
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials, navigate) => {
    try {
      setLoading(true); // Set loading during login process
      const response = await authAPI.login(credentials);

      // Store user data and token
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("token", response.token);
      setAuthToken(response.token);
      setUser(response.user);

      toast.success(`Welcome back, ${response.user.name}!`);

      // Redirect based on user role
      if (navigate) {
        switch (response.user.role) {
          case "Admin":
            navigate("/admin-dashboard");
            break;
          case "Customer":
            navigate("/customer-dashboard");
            break;
          case "Driver":
            navigate("/driver-dashboard");
            break;
          case "Accounts":
            navigate("/accounts-dashboard");
            break;
          case "Reports & MIS":
            navigate("/reports-dashboard");
            break;
          default:
            navigate("/");
        }
      }

      return response;
    } catch (error) {
      toast.error(error.message || "Login failed. Please try again.");
      throw error;
    } finally {
      setLoading(false); // Always reset loading state
    }
  };

  const signup = async (userData) => {
    try {
      setLoading(true); // Set loading during signup process
      const response = await authAPI.signup(userData);
      toast.success("Account created successfully! Please log in.");
      return response;
    } catch (error) {
      toast.error(error.message || "Signup failed. Please try again.");
      throw error;
    } finally {
      setLoading(false); // Always reset loading state
    }
  };

  const logout = (navigate) => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setAuthToken(null);
    setUser(null);
    toast.info("You have been logged out.");
    
    // Optionally redirect to login page after logout
    if (navigate) {
      navigate("/login");
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};