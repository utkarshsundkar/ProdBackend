import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://172.16.17.12:3000/api/v1/users";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = async (userData) => {
  return api.post("/register", userData);
};

export const loginUser = async (credentials) => {
  const response = await api.post("/login", credentials);
  if (response.data.accessToken) {
    await AsyncStorage.setItem("accessToken", response.data.accessToken);
  }
  return response.data;
};

export const logoutUser = async () => {
  await api.post("/logout");
  await AsyncStorage.removeItem("accessToken");
};

export const getCurrentUser = async () => {
  return api.get("/current-user");
};
