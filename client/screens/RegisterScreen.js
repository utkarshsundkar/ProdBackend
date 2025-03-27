import React, { useState, useContext } from "react";
import { View, TextInput, Button, Text } from "react-native";
import AuthContext from "../context/AuthContext.js";

const RegisterScreen = ({ navigation }) => {
  const { register } = useContext(AuthContext);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await register(fullName, email, password);
    } catch (error) {
      console.error("Registration failed", error.response?.data?.message);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Full Name"
        onChangeText={setFullName}
        value={fullName}
      />
      <TextInput placeholder="Email" onChangeText={setEmail} value={email} />
      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <Button title="Register" onPress={handleRegister} />
      <Button
        title="Already have an account? Login"
        onPress={() => navigation.navigate("Login")}
      />
    </View>
  );
};

export default RegisterScreen;
