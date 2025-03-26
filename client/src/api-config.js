import axios from "axios"

// Get the server info to dynamically set the API base URL
const getApiBaseUrl = async () => {
  try {
    // Try to get server info from the backend
    const response = await fetch("http://10.1.15.4:3001/api/server-info", {
      credentials: "include",
    })
    const data = await response.json()
    return data.apiUrl || "http://10.1.15.4:3001/api"
  } catch (error) {
    console.error("Failed to get server info:", error)
    return "http://10.1.15.4:3001/api"
  }
}

// Initialize with a default URL, will be updated after fetching server info
let API_BASE_URL = "http://10.1.15.4:3001/api"
console.log("Trying to connect to backend at:", API_BASE_URL)

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This is critical - it allows cookies to be sent
  headers: {
    "Content-Type": "application/json",
  },
})

// Update the base URL after getting server info
getApiBaseUrl().then((url) => {
  API_BASE_URL = url
  api.defaults.baseURL = API_BASE_URL
  console.log("API base URL initialized to:", API_BASE_URL)

  // Test the connection
  api
    .get("/server-info")
    .then((response) => {
      console.log("Connected to server at:", API_BASE_URL)
    })
    .catch((error) => {
      console.error("Failed to connect to server:", error.message)
    })
})

// Add a request interceptor to include the token from localStorage as a fallback
api.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage as a fallback
    const token = localStorage.getItem("token")
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add a response interceptor to handle auth errors and store tokens
api.interceptors.response.use(
  (response) => {
    // If the response includes a token, store it in localStorage
    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token)
    }
    return response
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.warn("Authentication error:", error.response.data)
      // You could redirect to login or dispatch an auth error event
    }
    return Promise.reject(error)
  },
)

export default api

