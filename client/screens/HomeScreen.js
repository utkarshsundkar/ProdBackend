import React, { useContext } from "react";
import { View, Button, Text } from "react-native";
import AuthContext from "../context/AuthContext.js";

const HomeScreen = ({ navigation }) => {
  const { logout, user } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
    console.log("User logged out, navigating to Onboarding");
    // Do not navigate manually; AppNavigation will handle redirect
  };

  return (
    <View>
      <Text>Welcome, {(user && user.username) ? user.username : "User"}!</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

export default HomeScreen;
