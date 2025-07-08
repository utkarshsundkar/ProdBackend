import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, SafeAreaView, TouchableWithoutFeedback, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const ForgetPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const continueScale = useRef(new Animated.Value(1)).current;
  const handleContinueIn = () => {
    Animated.spring(continueScale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };
  const handleContinueOut = () => {
    Animated.spring(continueScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };
  const showInvalid = email.length > 0 && !email.includes('@');
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      {/* <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backArrow}>{'←'}</Text>
        </Pressable>
        <Pressable style={styles.helpBtn}>
          <Text style={styles.helpText}>Need Help?</Text>
        </Pressable>
      </View> */}
      {/* Title */}
      <Text style={styles.title}>Forget Password!</Text>
      {/* Subheading */}
      {/* <Text style={styles.subheading}>Enter your email we will send you code on your email</Text> */}
      {/* Email Field */}
      <View style={styles.emailFieldContainer}>
        <TextInput
          style={styles.emailInput}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="hellobesnik@gmail.com"
          placeholderTextColor="#7D8A9C"
        />
        <View style={styles.underline} />
        {showInvalid && (
          <Text style={styles.invalidText}>Enter a valid mail</Text>
        )}
      </View>
      {/* Continue Button */}
      <TouchableWithoutFeedback onPressIn={handleContinueIn} onPressOut={handleContinueOut}>
        <Animated.View style={[styles.continueBtn, { transform: [{ scale: continueScale }] }]}> 
          <Text style={styles.continueBtnText}>Continue</Text>
        </Animated.View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: height * 0.06,
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backBtn: {
    padding: 4,
  },
  backArrow: {
    fontSize: 24,
    color: '#031B4E',
    fontWeight: 'bold',
  },
  helpBtn: {
    padding: 4,
  },
  helpText: {
    color: '#7D8A9C',
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#031B4E',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'System',
  },
  subheading: {
    fontSize: 14,
    color: '#7D8A9C',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'System',
  },
  emailFieldContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 36,
  },
  emailInput: {
    fontSize: 16,
    color: '#031B4E',
    width: '100%',
    textAlign: 'center',
    fontFamily: 'System',
    paddingVertical: 8,
  },
  underline: {
    width: '100%',
    height: 1.2,
    backgroundColor: '#E0E0E0',
    marginTop: -2,
    borderRadius: 1,
  },
  invalidText: {
    color: '#FF6B35',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  continueBtn: {
    width: '80%',
    backgroundColor: '#0093D6',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  continueBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});

export default ForgetPassword; 