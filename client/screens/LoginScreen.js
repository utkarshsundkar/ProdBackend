import React, { useState, useContext } from "react";
import { StyleSheet, View, Text, TextInput, Pressable, SafeAreaView, Dimensions, TouchableOpacity, Platform } from "react-native";
import AuthContext from "../context/AuthContext.js";
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setError("");
    try {
      const success = await login(email, password);
      if (success) {
        setError("");
        navigation.navigate("Home");
        console.log("Login successful, navigating to Home");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (error) {
      setError("Login failed. Please check your credentials.");
      console.error("Login failed", error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };
  
  const handleForgotPassword = () => {
    navigation.navigate("ForgetPassword");
  };

  // Fallback icon component for iOS
  const EyeIcon = ({ showPassword, size, color }) => {
    if (Platform.OS === 'ios') {
      return (
        <View style={[styles.fallbackIcon, { width: size, height: size }]}>
          <Text style={[styles.fallbackIconText, { color, fontSize: size * 0.6 }]}>
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </Text>
        </View>
      );
    }
    
    return (
      <Icon
        name={showPassword ? 'eye' : 'eye-off'}
        size={size}
        color={color}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subheading}>Fill the detail to sign in account</Text>
        {/* Error Message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {/* Input Fields */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder=""
            placeholderTextColor="#7D8A9C"
          />
          <View style={styles.underline} />
          <Text style={styles.inputLabel}>PASSWORD</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder=""
              placeholderTextColor="#7D8A9C"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn} hitSlop={10}>
              <EyeIcon showPassword={showPassword} size={Math.max(width * 0.06, 24)} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.underline} />
        </View>
        {/* Sign In Button */}
        <Pressable onPress={handleLogin} style={({ pressed }) => [styles.signInBtn, pressed && { transform: [{ scale: 0.96 }] }] }>
          <Text style={styles.signInBtnText}>Sign In</Text>
        </Pressable>
        {/* Forgot Password */}
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
        {/* Register Button */}
        <TouchableOpacity onPress={() => navigation.navigate("Register") } style={styles.registerBtn}>
          <Text style={styles.registerText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 40 : 0, // Adjust for iOS status bar
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.06, // 6% of screen width
    paddingTop: height * 0.06, // 6% of screen height
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.04, // 4% of screen height
  },
  backBtn: {
    padding: width * 0.01, // 1% of screen width
  },
  backArrow: {
    fontSize: Math.max(width * 0.06, 24), // Responsive font size, minimum 24
    color: '#031B4E',
    // fontWeight: 'bold',
    fontFamily: 'Lexend',
  },
  helpBtn: {
    padding: width * 0.01, // 1% of screen width
  },
  helpText: {
    color: '#7D8A9C',
    fontSize: Math.max(width * 0.035, 14), // Responsive font size, minimum 14
    // fontWeight: '500',
    fontFamily: 'Lexend',
  },
  title: {
    fontSize: Math.max(width * 0.065, 26), // Responsive font size, minimum 26
    // fontWeight: 'bold',
    color: '#031B4E',
    textAlign: 'center',
    marginBottom: height * 0.01, // 1% of screen height
    fontFamily: 'Lexend',
  },
  subheading: {
    fontSize: Math.max(width * 0.035, 14), // Responsive font size, minimum 14
    color: '#7D8A9C',
    textAlign: 'center',
    marginBottom: height * 0.04, // 4% of screen height
    fontFamily: 'Lexend',
  },
  inputGroup: {
    width: '100%',
    marginBottom: height * 0.045, // 4.5% of screen height
  },
  inputLabel: {
    color: '#7D8A9C',
    fontSize: Math.max(width * 0.03, 12), // Responsive font size, minimum 12
    // fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: height * 0.002, // 0.2% of screen height
    marginTop: height * 0.022, // 2.2% of screen height
    fontFamily: 'Lexend',
  },
  input: {
    fontSize: Math.max(width * 0.04, 16), // Responsive font size, minimum 16
    color: '#031B4E',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'Lexend',
    paddingVertical: height * 0.01, // 1% of screen height
  },
  underline: {
    width: '100%',
    height: Math.max(height * 0.0015, 1.2), // Responsive height, minimum 1.2
    backgroundColor: '#E0E0E0',
    marginTop: height * -0.002, // -0.2% of screen height
    borderRadius: 1,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  eyeBtn: {
    padding: width * 0.015, // 1.5% of screen width
    marginLeft: width * 0.01, // 1% of screen width
  },
  eyeIcon: {
    fontSize: Math.max(width * 0.045, 18), // Responsive font size, minimum 18
    color: '#7D8A9C',
  },
  signInBtn: {
    width: '80%',
    backgroundColor: '#0093D6',
    borderRadius: Math.max(width * 0.045, 18), // Responsive border radius, minimum 18
    paddingVertical: height * 0.02, // 2% of screen height
    alignItems: 'center',
    marginTop: height * 0.02, // 2% of screen height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: Math.max(width * 0.01, 4), // Responsive shadow radius, minimum 4
    elevation: 2,
  },
  signInBtnText: {
    color: '#fff',
    // fontWeight: 'bold',
    fontSize: Math.max(width * 0.045, 18), // Responsive font size, minimum 18
    letterSpacing: 0.5,
    fontFamily: 'Lexend',
  },
  forgotBtn: {
    marginTop: height * 0.022, // 2.2% of screen height
    alignItems: 'center',
    width: '100%',
  },
  forgotText: {
    color: '#FF6B35',
    // fontWeight: 'bold',
    fontSize: Math.max(width * 0.037, 15), // Responsive font size, minimum 15
    textAlign: 'center',
    letterSpacing: 0.2,
    fontFamily: 'Lexend',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: Math.max(width * 0.035, 14),
    fontFamily: 'Lexend',
  },
  registerBtn: {
    marginTop: height * 0.022, // 2.2% of screen height
    alignItems: 'center',
    width: '100%',
  },
  registerText: {
    color: '#0093D6',
    // fontWeight: 'bold',
    fontSize: Math.max(width * 0.037, 15), // Responsive font size, minimum 15
    textAlign: 'center',
    letterSpacing: 0.2,
    fontFamily: 'Lexend',
  },
  fallbackIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackIconText: {
    fontFamily: 'Apple Color Emoji', // Use Apple Color Emoji for fallback
  },
});

export default LoginScreen;