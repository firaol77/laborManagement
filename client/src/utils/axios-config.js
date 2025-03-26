import axios from "axios";

const API_BASE_URL = "http://10.1.15.4:3001/api";
console.log("Using API base URL:", API_BASE_URL);

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Essential for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - removed Authorization header logic
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add request logging here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - simplified for cookie-based auth
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized errors
      console.error("Authentication error - redirecting to login");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const apiRequest = async (method, endpoint, data = null, options = {}) => {
  try {
    const config = {
      method: method.toLowerCase(),
      url: endpoint,
      ...options,
    };

    if (method.toLowerCase() === "get") {
      config.params = data;
    } else {
      config.data = data;
    }

    const response = await axiosInstance(config);
    return response.data;
  } catch (error) {
    console.error(`API request failed:`, error);
    throw error;
  }
};

export default axiosInstance;