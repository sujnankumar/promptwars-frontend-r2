import axios from "axios"

const instance = axios.create({
  baseURL: "http://localhost:8000", // Change to your FastAPI backend URL if different
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
})

export default instance
