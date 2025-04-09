import Axios from "axios";

const axios = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
  },
  withCredentials: true, // Only if using cookies/sessions
});

// Add request interceptor
axios.interceptors.request.use(
  (config) => {
    // You can modify requests here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle CORS errors specifically
    if (error.response && error.response.status === 0) {
      error.message = "CORS error: Could not connect to API";
    }
    return Promise.reject(error);
  }
);

export default axios;
