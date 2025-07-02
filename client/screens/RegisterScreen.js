import React, { useContext, useState } from "react";
import { View, TextInput, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AuthContext from "../context/AuthContext.js"; 

const RegisterScreen = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register } = useContext(AuthContext);
  const navigation = useNavigation();

  const handleRegister = async () => {
    const success = await register(username, email, password);
    if (success) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    }
  };

  return (
    <View>
      <TextInput value={username} onChangeText={setUsername} placeholder="Username" />
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
      <Button title="Register" onPress={handleRegister} />
    </View>
  );
};

export default RegisterScreen;
