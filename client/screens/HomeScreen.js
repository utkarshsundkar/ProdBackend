import React, { useContext } from "react";
import { View, Button, Text } from "react-native";
import AuthContext from "../context/AuthContext.js";

const HomeScreen = () => {
  const { logout, user } = useContext(AuthContext);

  return (
    <View>
      <Text>Welcome, {user?.fullName || "User"}!</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
};

export default HomeScreen;
