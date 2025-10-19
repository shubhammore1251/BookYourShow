import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  withCredentials: true,
})

console.log("✅ API URL:", api.defaults.baseURL)

api.interceptors.response.use(
  (response) => {
    console.log({
      status: response.status,
      url: response.config.url,
      data: response.data,
    })
    return response
  },
  (error) => {
    console.log({
      error: error.response || error.message,
      status: error.response?.status,
      url: error.response?.config.url,
    })
    return Promise.reject(error)
  }
)

export default api
