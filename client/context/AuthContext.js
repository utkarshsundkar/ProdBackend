import React, {createContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const AuthContext = createContext();

const API_URL = 'http://172.16.17.12:3000/api/v1/users';

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        fetchCurrentUser();
      } else {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/current-user`);
      setUser(response.data.data);
    } catch (error) {
      console.error('Failed to fetch user', error);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/login`,
        {email, password},
        {
          timeout: 5000,
          headers: {'Content-Type': 'application/json'},
          withCredentials: true,
        },
      );

      if (response.data && response.data.data) {
        const {accessToken, user} = response.data.data;

        if (!accessToken) {
          console.error('No access token received');
          return;
        }

        await AsyncStorage.setItem('accessToken', accessToken);
        axios.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${accessToken}`;
        setUser(user); // Ensure user state updates
      } else {
        console.error('Invalid response format:', response.data);
      }
    } catch (error) {
      console.error('Login failed:', error.message);
    }
  };

  const register = async (email, username, fullName, password) => {
    try {
      const response = await axios.post(`${API_URL}/register`, {
        method: 'POST',
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
        body: JSON.stringify({email, username, fullName, password}),
      });

      if (response.ok) {
        console.log('Registration successful');
        await login(email, password);
      } else {
        const errorData = await response.json();
        console.error('Registration failed:', errorData);
      }
    } catch (error) {
      console.error('Registration failed:', error.message);
      if (error.response) {
        console.error('Server responded with:', error.response.data);
      } else if (error.request) {
        console.error('No response received. Request:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/logout`);
      await AsyncStorage.removeItem('accessToken');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{user, login, register, logout, loading}}>
      {children}
    </AuthContext.Provider>
  );
};
