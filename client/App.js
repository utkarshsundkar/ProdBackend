import React from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from "./context/AuthContext";
import { NightModeProvider } from "./context/NightModeContext";
import AppNavigation from "./navigation/AppNavigation.js";

const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NightModeProvider>
          <AppNavigation />
        </NightModeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;

