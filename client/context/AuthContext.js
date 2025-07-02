import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../src/api.js";

// Create Auth Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check token on app load
  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const res = await axios.get(`${BASE_URL}/users/current-user`);
        setUser(res.data.user);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  // Login User

const login = async (email, password) => {
  try {
    const res = await axios.post(`${BASE_URL}/users/login`, { email, password });
    const { accessToken, user } = res.data.data;
    await AsyncStorage.setItem("accessToken", accessToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    setUser(user);
    return true;
  } catch (err) {
    console.error("Login error:", err);
    return false;
  }
};


  // Register User
const register = async (username, email, password) => {
  try {
    const res = await axios.post(`${BASE_URL}/users/register`, { username, email, password });
    await login(email, password);
    return true; // success
  } catch (err) {
    console.error("Registration error:", err);
    return false;
  }
};

  // Logout User
  const logout = async () => {
    try {
      await axios.post(`${BASE_URL}/users/logout`, {}, {
        headers: {
          Authorization: axios.defaults.headers.common["Authorization"]
        }
      });
    } catch (error) {
      // Optionally handle error, but still clear local state
      console.error("Logout API error", error?.response?.data?.message || error.message);
    }
    await AsyncStorage.removeItem("accessToken");
    setUser(null);
    axios.defaults.headers.common["Authorization"] = "";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
