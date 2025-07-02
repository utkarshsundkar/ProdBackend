import React, { useState, useContext } from "react";
import { View, TextInput, Button, Text } from "react-native";
import AuthContext from "../context/AuthContext.js";

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {

    // console.log("Attempting to login with", { email, password });
    if (!email || !password) {
      console.error("Email and password are required");
      return;
    }
    
    try {
      await login(email, password);
    } catch (error) {
      throw error
      console.error("Login failed", error.response?.data?.message);
    }
    navigation.navigate("Home");
    console.log("Login successful, navigating to Home");
  };

  return (
    <View>
      <TextInput placeholder="Email" onChangeText={setEmail} value={email} />
      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <Button title="Login" onPress={handleLogin} />
      <Button
        title="Don't have an account? Register"
        onPress={() => navigation.navigate("Register")}
      />
    </View>
  );
};

export default LoginScreen;
