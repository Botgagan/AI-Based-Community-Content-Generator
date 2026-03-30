import axios from "axios";

export const url = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_DOMAIN || "http://localhost:5000",
  withCredentials: true, // REQUIRED for SuperTokens session
});
