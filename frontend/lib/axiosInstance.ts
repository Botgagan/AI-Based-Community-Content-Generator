import axios from "axios";

export const url = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true, // REQUIRED for SuperTokens session
});