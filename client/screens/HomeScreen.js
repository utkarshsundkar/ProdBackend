import React, { useContext } from "react";
import { View, Button, Text } from "react-native";
import AuthContext from "../context/AuthContext.js";

const HomeScreen = ({ navigation }) => {
  const { logout, user } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
    navigation.replace("Login");
  };

  return (
    <View>
      <Text>Welcome, {user?.fullName || "User"}!</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

export default HomeScreen;
