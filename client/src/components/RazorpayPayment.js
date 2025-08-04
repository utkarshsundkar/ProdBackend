import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../api.js';

const { width, height } = Dimensions.get('window');

const RazorpayPayment = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly'); // Default to yearly
  const [openCard, setOpenCard] = useState('yearly'); // Track which card is open
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));
  const [animationValues] = useState({
    monthly: new Animated.Value(0),
    quarterly: new Animated.Value(0),
    yearly: new Animated.Value(1), // Start with yearly open
  });

  const reviews = [
    {
      text: "Amazing app! Helped me achieve my fitness goals in just 3 months.",
      name: "Sarah M.",
      rating: 5
    },
    {
      text: "The workout plans are incredible. I've never felt stronger!",
      name: "Mike R.",
      rating: 5
    },
    {
      text: "Best fitness app I've ever used. Highly recommend!",
      name: "Emma L.",
      rating: 5
    },
    {
      text: "Lost 20 pounds in 6 months. This app changed my life!",
      name: "David K.",
      rating: 5
    },
    {
      text: "The personal coaching feature is worth every penny!",
      name: "Lisa P.",
      rating: 5
    }
  ];

  // Auto-scroll reviews every 2 seconds with smooth animation
  useEffect(() => {
    const interval = setInterval(() => {
      // Animate slide out to the left
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change review
        setCurrentReviewIndex((prevIndex) => 
          (prevIndex + 1) % reviews.length
        );
        // Reset position and slide in from right
        slideAnim.setValue(width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [reviews.length, slideAnim]);

  const currentReview = reviews[currentReviewIndex];

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: '₹249',
      originalPrice: '₹499',
      savings: '50% OFF',
      duration: 'month',
      popular: false,
      features: [
        'Unlimited Workouts',
        'Premium Exercises',
        'Progress Tracking',
        'Custom Plans',
        'Priority Support'
      ]
    },
    {
      id: 'quarterly',
      name: 'Quarterly',
      price: '₹699',
      originalPrice: '₹1,497',
      savings: '53% OFF',
      duration: 'quarter',
      popular: false,
      features: [
        'Everything in Monthly',
        'Advanced Analytics',
        'Personal Coach',
        'Nutrition Plans',
        'Quarterly Savings'
      ]
    },
    {
      id: 'yearly',
      name: 'Annual',
      price: '₹2,499',
      originalPrice: '₹5,988',
      savings: '58% OFF',
      duration: 'year',
      popular: true,
      features: [
        'Everything in Monthly',
        'Advanced Analytics',
        'Personal Coach',
        'Nutrition Plans',
        'Early Access Features',
        'Best Value'
      ]
    }
  ];

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);
  const openPlanData = plans.find(plan => plan.id === openCard);

  const handleCardPress = (planId) => {
    if (openCard === planId) {
      return; // Already open
    }

    // Animate the transition
    Animated.parallel([
      Animated.timing(animationValues[openCard], {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(animationValues[planId], {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    setOpenCard(planId);
    setSelectedPlan(planId);
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a plan first');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create order on your backend
      const authToken = await getAuthToken();
      
      // For testing purposes, if no token is found, show a helpful message
      if (!authToken) {
        Alert.alert(
          'Authentication Required',
          'Please login to your account first to make a payment.\n\nTo login:\n1. Go to Profile section\n2. Enter your email and password\n3. Try the payment again',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Debug Auth', onPress: debugAuthStatus }
          ]
        );
        setLoading(false);
        return;
      }

      console.log('🔐 Using auth token:', authToken.substring(0, 20) + '...');

      const orderResponse = await fetch(`${BASE_URL}/payment/createorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          planType: selectedPlan === 'monthly' ? 'monthly' : 'yearly'
        })
      });

      // Check if response is JSON
      const contentType = orderResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await orderResponse.text();
        console.error('❌ Non-JSON response:', errorText);
        throw new Error(`Server error: ${orderResponse.status} - ${orderResponse.statusText}`);
      }

      const orderData = await orderResponse.json();
      console.log('📡 Order data:', orderData);
      
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      // Validate order data
      if (!orderData.data.order || !orderData.data.order.id) {
        throw new Error('Invalid order data received from server');
      }

      console.log('📡 Order ID:', orderData.data.order.id);
      console.log('📡 Order Amount:', orderData.data.order.amount);
      console.log('📡 Razorpay Key:', orderData.data.razorpayKey);

      // Step 2: Initialize Razorpay Checkout - Use same format as working test
      const options = {
        key: orderData.data.razorpayKey,
        amount: orderData.data.order.amount,
        currency: orderData.data.order.currency,
        name: 'Fitness App Premium',
        description: `${selectedPlanData.name} Plan - ${selectedPlanData.duration}`,
        order_id: orderData.data.order.id,
        prefill: {
          email: 'user@example.com',
          contact: '9999999999',
          name: 'User Name',
        },
        theme: {
          color: '#4CAF50'
        }
      };

      console.log('💳 Opening Razorpay with options:', JSON.stringify(options, null, 2));

      // Open Razorpay Checkout
      try {
        console.log('💳 Attempting to open Razorpay...');
        const data = await RazorpayCheckout.open(options);
        console.log('💳 Razorpay response:', data);
        
        // Step 3: Verify payment on backend
        await verifyPayment(data, orderData.data.paymentId);
      } catch (razorpayError) {
        console.error('❌ Razorpay error:', razorpayError);
        
        // Handle specific Razorpay error codes
        if (razorpayError.code === 'PAYMENT_CANCELLED') {
          console.log('💳 Payment was cancelled by user');
          Alert.alert(
            'Payment Cancelled', 
            'You cancelled the payment. You can try again anytime.',
            [{ text: 'OK', onPress: () => console.log('Payment cancelled by user') }]
          );
        } else if (razorpayError.code === 'NETWORK_ERROR') {
          console.log('💳 Network error with Razorpay');
          Alert.alert(
            'Network Error', 
            'Unable to connect to payment gateway. Please check your internet connection and try again.',
            [{ text: 'OK', onPress: () => console.log('Network error acknowledged') }]
          );
        } else if (razorpayError.code === 'INVALID_PAYMENT_METHOD') {
          console.log('💳 Invalid payment method');
          Alert.alert(
            'Payment Method Error', 
            'The selected payment method is not available. Please try a different payment option.',
            [{ text: 'OK', onPress: () => console.log('Invalid payment method acknowledged') }]
          );
        } else if (razorpayError.code === 'PAYMENT_FAILED') {
          console.log('💳 Payment failed');
          Alert.alert(
            'Payment Failed', 
            'The payment was not successful. Please check your payment details and try again.',
            [{ text: 'OK', onPress: () => console.log('Payment failed acknowledged') }]
          );
        } else if (razorpayError.code === 'ORDER_NOT_FOUND') {
          console.log('💳 Order not found');
          Alert.alert(
            'Order Error', 
            'The payment order was not found. Please try again.',
            [{ text: 'OK', onPress: () => console.log('Order not found acknowledged') }]
          );
        } else if (razorpayError.code === 'INVALID_AMOUNT') {
          console.log('💳 Invalid amount');
          Alert.alert(
            'Amount Error', 
            'The payment amount is invalid. Please try again.',
            [{ text: 'OK', onPress: () => console.log('Invalid amount acknowledged') }]
          );
        } else if (razorpayError.message && razorpayError.message.includes('Something went wrong')) {
          console.log('💳 Razorpay configuration error');
          Alert.alert(
            'Configuration Error', 
            'There was an issue with the payment gateway. Please try again later.',
            [{ text: 'OK', onPress: () => console.log('Configuration error acknowledged') }]
          );
        } else {
          console.log('💳 Unknown Razorpay error:', razorpayError);
          Alert.alert(
            'Payment Error', 
            'Something went wrong with the payment. Please try again or contact support if the issue persists.',
            [{ text: 'OK', onPress: () => console.log('Unknown error acknowledged') }]
          );
        }
        
        setLoading(false);
        return;
      }

    } catch (error) {
      console.error('❌ Payment error:', error);
      
      // Don't show alert for user-initiated cancellations
      if (error.code !== 'PAYMENT_CANCELLED') {
        let errorTitle = 'Payment Error';
        let errorMessage = 'Something went wrong with the payment. Please try again.';
        
        // Handle specific error types
        if (error.message && error.message.includes('Network request failed')) {
          errorTitle = 'Network Error';
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.message && error.message.includes('Server error')) {
          errorTitle = 'Server Error';
          errorMessage = 'There was an issue with our servers. Please try again in a few minutes.';
        } else if (error.message && error.message.includes('Authentication')) {
          errorTitle = 'Authentication Error';
          errorMessage = 'Please login to your account first to make a payment.';
        } else if (error.message && error.message.includes('Invalid order data')) {
          errorTitle = 'Order Error';
          errorMessage = 'There was an issue creating your payment order. Please try again.';
        }
        
        Alert.alert(errorTitle, errorMessage, [
          { text: 'OK', onPress: () => console.log('Payment error acknowledged') }
        ]);
      }
      setLoading(false);
    }
  };

  const verifyPayment = async (razorpayResponse, paymentId) => {
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found. Please login again.');
      }

      console.log('🔍 Verifying payment with data:', {
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
        planType: selectedPlan,
        paymentId: paymentId,
        method: 'razorpay'
      });

      const verifyResponse = await fetch(`${BASE_URL}/payment/verifyPayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          planType: selectedPlan,
          paymentId: paymentId,
          method: 'razorpay'
        })
      });

      console.log('🔍 Verification response status:', verifyResponse.status);

      // Check if response is JSON
      const contentType = verifyResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await verifyResponse.text();
        console.error('❌ Non-JSON response from verification:', errorText);
        throw new Error('Server error: Invalid response format from verification');
      }

      const verifyData = await verifyResponse.json();
      console.log('🔍 Verification data:', verifyData);
      
      if (verifyData.success) {
        Alert.alert(
          'Payment Successful!',
          'Your premium plan has been activated successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess();
                onClose();
              }
            }
          ]
        );
      } else {
        throw new Error(verifyData.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      
      let errorTitle = 'Verification Error';
      let errorMessage = 'Payment verification failed. Please contact support if you were charged.';
      
      // Handle specific verification errors
      if (error.message && error.message.includes('Invalid signature')) {
        errorTitle = 'Security Error';
        errorMessage = 'Payment verification failed due to security reasons. Please try again or contact support.';
      } else if (error.message && error.message.includes('Payment not found')) {
        errorTitle = 'Payment Error';
        errorMessage = 'Payment record not found. Please try again or contact support.';
      } else if (error.message && error.message.includes('Network request failed')) {
        errorTitle = 'Network Error';
        errorMessage = 'Unable to verify payment due to network issues. Please check your connection and try again.';
      } else if (error.message && error.message.includes('Server error')) {
        errorTitle = 'Server Error';
        errorMessage = 'Unable to verify payment due to server issues. Please try again in a few minutes.';
      }
      
      Alert.alert(errorTitle, errorMessage, [
        { text: 'OK', onPress: () => console.log('Verification error acknowledged') }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    try {
      // Try to get token from AsyncStorage - use the correct key from AuthContext
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        console.log('✅ Found accessToken:', token.substring(0, 20) + '...');
        return token;
      }
      
      // If no token in AsyncStorage, try other common keys
      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        console.log('✅ Found userToken:', userToken.substring(0, 20) + '...');
        return userToken;
      }
      
      const jwtToken = await AsyncStorage.getItem('jwtToken');
      if (jwtToken) {
        console.log('✅ Found jwtToken:', jwtToken.substring(0, 20) + '...');
        return jwtToken;
      }
      
      const authToken = await AsyncStorage.getItem('authToken');
      if (authToken) {
        console.log('✅ Found authToken:', authToken.substring(0, 20) + '...');
        return authToken;
      }
      
      // If no token found, return null
      console.warn('❌ No authentication token found in storage');
      console.log('🔍 Checked keys: accessToken, userToken, jwtToken, authToken');
      return null;
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  };

  // Debug function to check all stored tokens
  const debugAuthStatus = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const authKeys = allKeys.filter(key => key.toLowerCase().includes('token'));
      console.log('🔍 All auth-related keys:', authKeys);
      
      for (const key of authKeys) {
        const value = await AsyncStorage.getItem(key);
        console.log(`🔍 ${key}:`, value ? value.substring(0, 20) + '...' : 'null');
      }

      // First test basic server connectivity
      try {
        console.log('🔍 Testing server connectivity...');
        const serverTest = await fetch(`${BASE_URL.replace('/api/v1', '')}/`);
        if (serverTest.ok) {
          console.log('✅ Server is reachable');
        } else {
          console.log('❌ Server returned status:', serverTest.status);
        }
      } catch (serverError) {
        console.log('❌ Cannot reach server:', serverError.message);
        Alert.alert('Server Issue', '❌ Cannot reach server. Please check if server is running on port 3000.');
        return;
      }

      // Test Razorpay SDK
      try {
        console.log('🔍 Testing Razorpay SDK...');
        // Test if RazorpayCheckout is available
        if (typeof RazorpayCheckout !== 'undefined') {
          console.log('✅ Razorpay SDK is loaded');
          Alert.alert('SDK Test', '✅ Razorpay SDK is available');
        } else {
          console.log('❌ Razorpay SDK not found');
          Alert.alert('SDK Test', '❌ Razorpay SDK not found');
        }
      } catch (sdkError) {
        console.log('❌ Razorpay SDK error:', sdkError);
        Alert.alert('SDK Test', `❌ Razorpay SDK error: ${sdkError.message}`);
      }

      // Test if user is logged in by checking current user endpoint
      const authToken = await AsyncStorage.getItem('accessToken');
      if (authToken) {
        try {
          const url = `${BASE_URL}/users/current-user`;
          console.log('🔍 Testing auth with URL:', url);
          console.log('🔍 Using token:', authToken.substring(0, 20) + '...');
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          console.log('🔍 Response status:', response.status);
          console.log('🔍 Response headers:', response.headers);
          
          if (response.ok) {
            const userData = await response.json();
            console.log('✅ User is logged in:', userData.data.user.email);
            Alert.alert('Auth Status', `✅ Logged in as: ${userData.data.user.email}`);
          } else {
            const errorText = await response.text();
            console.log('❌ User not logged in - API returned:', response.status);
            console.log('❌ Error response:', errorText);
            
            if (response.status === 404) {
              Alert.alert('Network Issue', '❌ Cannot reach server. Make sure:\n\n1. Server is running on port 3000\n2. Android emulator can access 10.0.2.2:3000\n3. Try restarting the emulator');
            } else {
              Alert.alert('Auth Status', `❌ Not logged in - Status: ${response.status}`);
            }
          }
        } catch (error) {
          console.log('❌ Error checking user status:', error);
          
          if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
            Alert.alert('Network Error', '❌ Cannot connect to server.\n\nThis is likely because:\n1. Server is not running\n2. Android emulator network issue\n3. Wrong IP address\n\nTry:\n1. Restart the server\n2. Restart the emulator\n3. Check if server is on port 3000');
          } else {
            Alert.alert('Auth Status', `❌ Error: ${error.message}`);
          }
        }
      } else {
        Alert.alert('Auth Status', '❌ No access token found - Please login first');
      }
    } catch (error) {
      console.error('❌ Error debugging auth status:', error);
      Alert.alert('Debug Error', error.message);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>Try Fitness App for free</Text>
          <Text style={styles.headerTitle}>Unlock All Features</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {/* User Reviews Section */}
          <View style={styles.reviewsSection}>
            <Animated.View
              style={[
                styles.reviewContainer,
                {
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <View style={styles.starsContainer}>
                {[...Array(currentReview.rating)].map((_, index) => (
                  <Text key={index} style={styles.star}>⭐</Text>
                ))}
              </View>
              <Text style={styles.reviewText}>"{currentReview.text}"</Text>
              <Text style={styles.reviewerName}>- {currentReview.name}</Text>
            </Animated.View>
          </View>

          {/* Interactive Plan Cards */}
          <View style={styles.cardsContainer}>
            {plans.map((plan) => {
              const isSelected = openCard === plan.id;
              const isPopular = plan.popular;
              
              return (
                <Animated.View
                  key={plan.id}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: isSelected ? '#FF6B35' : '#FFF3E0', // Orange theme
                      borderWidth: isSelected ? 0 : 2,
                      borderColor: isSelected ? 'transparent' : '#FF6B35', // Orange border
                      height: animationValues[plan.id].interpolate({
                        inputRange: [0, 1],
                        outputRange: [80, height * 0.35], // Smaller expanded height for 3 cards
                      }),
                      opacity: animationValues[plan.id].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.cardTouchable}
                    onPress={() => handleCardPress(plan.id)}
                    activeOpacity={0.8}
                  >
                    {/* Card Header - Always Visible */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardPricing}>
                        <Text style={[
                          styles.cardPrice,
                          { color: isSelected ? '#fff' : '#FF6B35' } // Orange text
                        ]}>
                          {plan.price}
                        </Text>
                        <Text style={[
                          styles.cardPriceSubtext,
                          { color: isSelected ? '#fff' : '#FF6B35' } // Orange text
                        ]}>
                          /{plan.duration}
                        </Text>
                      </View>
                      <View style={styles.cardTitle}>
                        <Text style={[
                          styles.cardTitleText,
                          { color: isSelected ? '#fff' : '#FF6B35' } // Orange text
                        ]}>
                          {plan.name} Plan
                        </Text>
                        {isPopular && (
                          <View style={[
                            styles.popularBadge,
                            { 
                              backgroundColor: isSelected ? '#fff' : '#FF6B35', // Orange badge
                            }
                          ]}>
                            <Text style={[
                              styles.popularBadgeText,
                              { color: isSelected ? '#FF6B35' : '#fff' } // Orange text on white
                            ]}>
                              Popular
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Expanded Content - Animated */}
                    <Animated.View
                      style={[
                        styles.expandedContent,
                        {
                          opacity: animationValues[plan.id],
                          transform: [
                            {
                              translateY: animationValues[plan.id].interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Text style={[
                        styles.planDescription,
                        { color: isSelected ? '#FFE0B2' : '#FF6B35' } // Light orange on selected
                      ]}>
                        Enjoy complete access to Fitness App features for {plan.duration === 'month' ? 'a month' : plan.duration === 'quarter' ? '3 months' : 'a full year'}.
                      </Text>

                      <Text style={[
                        styles.featuresTitle,
                        { color: isSelected ? '#fff' : '#FF6B35' } // Orange text
                      ]}>
                        This plan gets
                      </Text>
                      
                      <View style={styles.featuresCard}>
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <View key={index} style={styles.featureItem}>
                            <Text style={[
                              styles.featureIcon,
                              { color: '#FF6B35' } // Orange checkmarks
                            ]}>
                              ✓
                            </Text>
                            <Text style={[
                              styles.featureText,
                              { color: '#333' }
                            ]}>
                              {feature}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </Animated.View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>

        {/* Payment Button - Fixed at Bottom */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.payButton}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.payButtonText}>Start 7 days free trial</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Remove white background
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'center',
    position: 'relative',
    height: 70, // Reduced from 80
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2, // Reduced from 4
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#666',
  },
  reviewsSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0, // Removed bottom padding to minimize gap
    alignItems: 'center',
    height: 110, // Further reduced height to bring cards closer
    overflow: 'hidden', // Hide overflow during animation
  },
  reviewContainer: {
    width: width, // Ensure it takes full width
    alignItems: 'center',
    position: 'absolute', // Position absolutely to prevent layout shifts
    top: 0,
    left: 0,
    paddingBottom: 30, // Add space for dots
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 12, // Increased from 8
  },
  star: {
    fontSize: 24,
    color: '#FFD700', // Gold color for stars
  },
  reviewText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#555',
    marginBottom: 8, // Increased from 5
  },
  reviewerName: {
    fontSize: 14,
    color: '#666',
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15, // Reduced from 25 to bring cards closer to dots
  },
  planCard: {
    borderRadius: 20,
    marginBottom: 8, // Reduced from 12 to bring cards closer together
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardTouchable: {
    flex: 1,
    padding: 20,
    paddingLeft: 20, // Ensure consistent left padding
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Reduced from 16
  },
  cardPricing: {
    alignItems: 'flex-start',
  },
  cardPrice: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  cardPriceSubtext: {
    fontSize: 14,
    marginTop: -2,
  },
  cardTitle: {
    alignItems: 'flex-end',
  },
  cardTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  popularBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  expandedContent: {
    flex: 1,
    paddingLeft: 0, // Remove any left padding
    marginLeft: 0, // Remove any left margin
  },
  planDescription: {
    fontSize: 14, // Reduced from 15
    textAlign: 'left',
    marginBottom: 12, // Reduced from 20
    lineHeight: 18, // Reduced from 20
    paddingLeft: 0, // Ensure no left padding
  },
  featuresTitle: {
    fontSize: 16, // Reduced from 18
    fontWeight: 'bold',
    marginBottom: 10, // Reduced from 16
    textAlign: 'left',
    paddingLeft: 0, // Ensure no left padding
  },
  featuresCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16, // Reduced from 20
    width: '100%',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginLeft: 0, // Ensure no left margin
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Reduced from 12
  },
  featureIcon: {
    fontSize: 16, // Reduced from 18
    marginRight: 10, // Reduced from 12
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 13, // Reduced from 14
    flex: 1,
    lineHeight: 16, // Reduced from 18
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent', // Remove white background
  },
  payButton: {
    backgroundColor: '#FF6B35', // Orange theme
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100, // Add padding to the bottom to make space for the fixed button
  },
});

export default RazorpayPayment; 