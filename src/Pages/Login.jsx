import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Mail,
  Lock,
  User,
  Phone,
  ChevronDown,
  CheckCircle,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { authAPI, setAuthToken } from "../utils/Api";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "Customer",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // Clear previous errors

    try {
      if (isLogin) {
        // Handle Login using the auth context
        const { email, password } = formData;
        await login({ email, password }, navigate);
        // No need to manually redirect - the login function handles it
      } else {
        // Handle Signup using the auth context
        const response = await signup(formData);
        
        toast.success(response.message || "Account created successfully! Please log in.");
        setIsLogin(true); // Switch to login form after successful signup
        setFormData({ name: "", email: "", phone: "", password: "", role: "Customer" });
      }
    } catch (err) {
      console.error("Authentication error:", err);
      const errorMessage = 
        typeof err === 'string' 
          ? err 
          : err.message || "Authentication failed. Please check your credentials.";
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(""); // Clear errors when switching modes
  };

  const roles = ["Admin", "Accounts", "Reports & MIS", "Customer", "Driver"];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex flex-col w-full md:w-1/2 bg-white">
        <div className="flex flex-grow items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-4">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">
                Fleet Management
              </h1>
              <p className="text-gray-500 mt-2">
                {isLogin ? "Sign in to your account" : "Create a new account"}
              </p>
            </div>

            {/* Auth Tabs */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`w-1/2 py-2 text-sm font-medium rounded-md transition-all ${
                  isLogin
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center justify-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </span>
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`w-1/2 py-2 text-sm font-medium rounded-md transition-all ${
                  !isLogin
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center justify-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Only show name field on signup */}
              {!isLogin && (
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Doe"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Only show phone field on signup */}
              {!isLogin && (
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 (555) 123-4567"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              {/* Only show role dropdown on signup */}
              {!isLogin && (
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Role
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none focus:ring-blue-500 focus:border-blue-500"
                      required={!isLogin}
                    >
                      <option value="" disabled>
                        Select Role
                      </option>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Remember me
                    </label>
                  </div>
                  <div className="text-sm">
                    <button
                      type="button"
                      className="font-medium text-blue-600 hover:text-blue-500"
                      onClick={() => toast.info("Password reset functionality coming soon!")}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading && "opacity-75 cursor-not-allowed"
                  }`}
                >
                  {loading
                    ? "Processing..."
                    : isLogin
                    ? "Sign In"
                    : "Create Account"}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Fleet Management System. All rights
          reserved.
        </div>
      </div>

      {/* Image/Background Section - Hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 bg-blue-600">
        <div className="flex items-center justify-center w-full h-full p-12">
          <div className="text-white max-w-md">
            <h2 className="text-3xl font-bold mb-6">
              Manage Your Fleet with Confidence
            </h2>
            <p className="text-blue-100 mb-6">
              Our comprehensive fleet management system helps you track
              vehicles, manage drivers, and optimize routes for maximum
              efficiency.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 mr-3 text-blue-200 flex-shrink-0" />
                <p className="text-blue-100">
                  Real-time vehicle tracking and analytics
                </p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 mr-3 text-blue-200 flex-shrink-0" />
                <p className="text-blue-100">
                  Comprehensive maintenance scheduling
                </p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 mr-3 text-blue-200 flex-shrink-0" />
                <p className="text-blue-100">
                  Detailed reporting and fleet performance metrics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}