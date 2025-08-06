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
import { useNightMode } from '../../context/NightModeContext.js';

const { width, height } = Dimensions.get('window');

const RazorpayPayment = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('starter'); // Default to starter
  const [openCard, setOpenCard] = useState('starter'); // Track which card is open
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [userPlanStatus, setUserPlanStatus] = useState(null);
  const [availablePlans, setAvailablePlans] = useState({
    starter: true,
    monthly: true,
    yearly: true
  });
  const [userCredits, setUserCredits] = useState(0);
  const [appliedCredits, setAppliedCredits] = useState(0);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const { isNightMode } = useNightMode();
  const [animationValues] = useState({
    starter: new Animated.Value(1), // Start with starter open
    monthly: new Animated.Value(0),
    yearly: new Animated.Value(0),
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

  // Fetch user's plan status when component mounts
  useEffect(() => {
    if (visible) {
      fetchUserPlanStatus();
    }
  }, [visible]);

  const fetchUserPlanStatus = async () => {
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        console.log('❌ No auth token found for plan status check');
        return;
      }

      const response = await fetch(`${BASE_URL}/payment/user-plan-status`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 User plan status:', data.data);
        
        setUserPlanStatus(data.data);
        setAvailablePlans(data.data.availablePlans);
        setUserCredits(data.data.userCredits || 0);

        // If starter plan is not available, default to monthly
        if (!data.data.availablePlans.starter && selectedPlan === 'starter') {
          setSelectedPlan('monthly');
          setOpenCard('monthly');
          // Update animation values
          animationValues.starter.setValue(0);
          animationValues.monthly.setValue(1);
        }
      } else {
        console.log('❌ Failed to fetch user plan status');
      }
    } catch (error) {
      console.error('❌ Error fetching user plan status:', error);
    }
  };

  const handleApplyCredits = () => {
    if (userCredits > 0) {
      setShowCreditModal(true);
    }
  };

  const handleCreditApplication = (creditsToApply) => {
    setAppliedCredits(creditsToApply);
    setShowCreditModal(false);
  };

  const currentReview = reviews[currentReviewIndex];

  // Calculate monthly plan price with credits
  const calculateMonthlyPrice = (basePrice = 499, credits = appliedCredits) => {
    const discountPer25Credits = 10; // ₹10 discount per 25 credits
    const maxDiscount = 150; // Maximum ₹150 discount (₹499 - ₹349)
    
    // Cap credits at 150 since that's the maximum discount
    const effectiveCredits = Math.min(credits, 150);
    const discount = Math.min((effectiveCredits / 25) * discountPer25Credits, maxDiscount);
    const finalPrice = Math.max(basePrice - discount, 349); // Minimum ₹349
    
    return {
      originalPrice: basePrice,
      discountedPrice: finalPrice,
      discount: basePrice - finalPrice,
      creditsUsed: Math.floor((basePrice - finalPrice) / discountPer25Credits) * 25
    };
  };

  const monthlyPricing = calculateMonthlyPrice(499, appliedCredits);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '₹100',
      originalPrice: '₹200',
      savings: '50% OFF',
      duration: '14 days',
      popular: false,
      features: [
        'Full App Access',
        'Basic Workouts',
        'Progress Tracking'
      ]
    },
    {
      id: 'monthly',
      name: 'Monthly',
      price: `₹${monthlyPricing.discountedPrice}`,
      originalPrice: `₹${monthlyPricing.originalPrice}`,
      savings: monthlyPricing.discount > 0 ? `₹${monthlyPricing.discount} OFF` : '17% OFF',
      duration: 'month',
      popular: false,
      features: [
        'Everything in Starter',
        'Advanced Workouts',
        'Personalized Plans'
      ],
      note: 'Price reduces by ₹10 for every 25 credits earned',
      hasCredits: userCredits > 0,
      appliedCredits: appliedCredits,
      creditsAvailable: userCredits
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
        'Premium Analytics',
        'Personal Coach'
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
      console.log('📋 Selected plan:', selectedPlan);
      console.log('📋 Selected plan data:', selectedPlanData);

      const orderResponse = await fetch(`${BASE_URL}/payment/createorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          planType: selectedPlan === 'starter' ? 'starter' : selectedPlan === 'monthly' ? 'monthly' : 'yearly',
          appliedCredits: selectedPlan === 'monthly' ? appliedCredits : 0
        })
      });

      console.log('📡 Order response status:', orderResponse.status);
      console.log('📡 Order response headers:', orderResponse.headers);

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
          setShowFailureModal(true);
        } else if (razorpayError.code === 'NETWORK_ERROR') {
          console.log('💳 Network error with Razorpay');
          setShowFailureModal(true);
        } else if (razorpayError.code === 'INVALID_PAYMENT_METHOD') {
          console.log('💳 Invalid payment method');
          setShowFailureModal(true);
        } else if (razorpayError.code === 'PAYMENT_FAILED') {
          console.log('💳 Payment failed');
          setShowFailureModal(true);
        } else if (razorpayError.code === 'ORDER_NOT_FOUND') {
          console.log('💳 Order not found');
          setShowFailureModal(true);
        } else if (razorpayError.code === 'INVALID_AMOUNT') {
          console.log('💳 Invalid amount');
          setShowFailureModal(true);
        } else if (razorpayError.message && razorpayError.message.includes('Something went wrong')) {
          console.log('💳 Razorpay configuration error');
          setShowFailureModal(true);
        } else {
          console.log('💳 Unknown Razorpay error:', razorpayError);
          setShowFailureModal(true);
        }
        
        setLoading(false);
        return;
      }

    } catch (error) {
      console.error('❌ Payment error:', error);
      
      // Don't show alert for user-initiated cancellations
      if (error.code !== 'PAYMENT_CANCELLED') {
        setShowFailureModal(true);
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
          method: 'razorpay',
          appliedCredits: selectedPlan === 'monthly' ? appliedCredits : 0
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
        const creditMessage = selectedPlan === 'monthly' && appliedCredits > 0 
          ? `\n\n${appliedCredits} credits have been deducted from your account.`
          : '';
          
        Alert.alert(
          'Payment Successful!',
          `Your premium plan has been activated successfully.${creditMessage}`,
          [
            {
              text: 'OK',
              onPress: () => {
                fetchUserPlanStatus(); // Refresh plan status
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
      <SafeAreaView style={[
        styles.container,
        isNightMode && { backgroundColor: '#1a1a1a' }
      ]}>
        <StatusBar barStyle={isNightMode ? "light-content" : "dark-content"} backgroundColor={isNightMode ? "#1a1a1a" : "#fafafa"} />
        
        {/* Header */}
        <View style={[
          styles.header,
          isNightMode && { backgroundColor: '#1a1a1a' }
        ]}>
          <Text style={[
            styles.headerSubtitle,
            isNightMode && { color: '#cccccc' }
          ]}>Try Fitness App for free</Text>
          <Text style={[
            styles.headerTitle,
            isNightMode && { color: '#ffffff' }
          ]}>Unlock All Features</Text>
          <TouchableOpacity onPress={onClose} style={[
            styles.closeButton,
            isNightMode && { backgroundColor: '#333333' }
          ]}>
            <Text style={[
              styles.closeText,
              isNightMode && { color: '#ffffff' }
            ]}>✕</Text>
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
              <Text style={[
                styles.reviewText,
                isNightMode && { color: '#cccccc' }
              ]}>"{currentReview.text}"</Text>
              <Text style={[
                styles.reviewerName,
                isNightMode && { color: '#999999' }
              ]}>- {currentReview.name}</Text>
            </Animated.View>
          </View>

          {/* Interactive Plan Cards */}
          <View style={styles.cardsContainer}>
            {plans
              .filter(plan => availablePlans[plan.id]) // Only show available plans
              .map((plan) => {
              const isSelected = openCard === plan.id;
              const isPopular = plan.popular;
              
              return (
                <Animated.View
                  key={plan.id}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: isSelected ? '#FF8C42' : (isNightMode ? '#333333' : '#000'), // Dark gray in night mode, black in light mode
                      borderWidth: isSelected ? 0 : 2,
                      borderColor: isSelected ? 'transparent' : (isNightMode ? '#444444' : '#000'), // Darker gray border in night mode
                      height: animationValues[plan.id].interpolate({
                        inputRange: [0, 1],
                        outputRange: [80, plan.id === 'monthly' ? height * 0.40 : height * 0.35], // More height for monthly plan
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
                          { color: isSelected ? '#fff' : '#fff' } // White text on both selected and unselected
                        ]}>
                          {plan.price}
                        </Text>
                        <Text style={[
                          styles.cardPriceSubtext,
                          { color: isSelected ? '#fff' : '#ccc' } // Light gray text on unselected
                        ]}>
                          /{plan.duration}
                        </Text>
                      </View>
                      <View style={styles.cardTitle}>
                        <Text style={[
                          styles.cardTitleText,
                          { color: isSelected ? '#fff' : '#fff' } // White text on both selected and unselected
                        ]}>
                          {plan.name} Plan
                        </Text>
                        {isPopular && (
                          <View style={[
                            styles.popularBadge,
                            { 
                              backgroundColor: isSelected ? '#fff' : '#FF8C42', // Light orange badge on black
                            }
                          ]}>
                            <Text style={[
                              styles.popularBadgeText,
                              { color: isSelected ? '#FF8C42' : '#fff' } // Light orange text on white
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
                        { color: '#000' } // Black text for all plans
                      ]}>
                        {plan.id === 'starter' 
                          ? 'Get started with full app access for 14 days to experience all features.'
                          : plan.id === 'monthly'
                          ? 'Enjoy complete access to Fitness App features for a month with credit-based discounts.'
                          : 'Enjoy complete access to Fitness App features for a full year with maximum savings.'
                        }
                      </Text>

                      {plan.id === 'monthly' && (
                        <Text style={[
                          styles.planDescription,
                          { color: '#000', fontSize: 12, fontStyle: 'italic' } // Black text
                        ]}>
                          {plan.note}
                        </Text>
                      )}

                      <Text style={[
                        styles.featuresTitle,
                        { color: '#000' } // Black text
                      ]}>
                        This plan gets
                      </Text>
                      
                      <View style={[
                        styles.featuresCard,
                        plan.id === 'monthly' && { minHeight: 140 }, // Extra height for monthly plan
                        isNightMode && { backgroundColor: '#2a2a2a' } // Dark background in night mode
                      ]}>
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
                              { color: isNightMode ? '#ffffff' : '#333' }
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
          <View style={styles.bottomButtonsContainer}>
            {/* Credit Button - Only show for monthly plan when user has credits */}
            {selectedPlan === 'monthly' && userCredits > 0 ? (
              <>
                <TouchableOpacity
                  style={styles.creditButton}
                  onPress={handleApplyCredits}
                >
                  <Text style={styles.creditButtonText}>
                    {appliedCredits > 0 ? `Use ${appliedCredits} Credits` : 'Use Credits'}
                  </Text>
                  {appliedCredits > 0 && (
                    <Text style={styles.creditButtonSubtext}>
                      Save ₹{monthlyPricing.discount}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Payment Button - Equal size with credit button */}
                <TouchableOpacity
                  style={[
                    styles.payButton,
                    isNightMode && { backgroundColor: '#FF8C42' }, // Orange in night mode instead of black
                    { flex: 1, marginLeft: 10 } // Equal size with credit button
                  ]}
                  onPress={handlePayment}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.payButtonText}>Start 14 day journey</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              /* Full width payment button for all other cases */
              <TouchableOpacity
                style={[
                  styles.payButton,
                  isNightMode && { backgroundColor: '#FF8C42' }, // Orange in night mode instead of black
                  { width: '100%' } // Full width
                ]}
                onPress={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.payButtonText}>Start 14 day journey</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Show applied credits info below buttons */}
          {/* Removed applied credits info section */}
        </View>
      </SafeAreaView>

      {/* Payment Failure Modal */}
      <Modal
        visible={showFailureModal}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setShowFailureModal(false)}
      >
        <SafeAreaView style={[
          styles.failureModalOverlay,
          isNightMode && { backgroundColor: '#1a1a1a' }
        ]}>
          <View style={[
            styles.failureModalContent,
            isNightMode && { backgroundColor: '#1a1a1a' }
          ]}>
            {/* Orange Exclamation Icon */}
            <View style={styles.failureIconContainer}>
              <View style={styles.failureIcon}>
                <Text style={styles.failureExclamation}>!</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={[
              styles.failureTitle,
              isNightMode && { color: '#ffffff' }
            ]}>Order not completed</Text>

            {/* First Message */}
            <Text style={[
              styles.failureMessage,
              isNightMode && { color: '#cccccc' }
            ]}>
              If money has been debited from your bank account, please wait for us to process your order. If we're unable to complete your order successfully, you'll receive a full refund within 5 - 7 business days.
            </Text>

            {/* Second Message */}
            <Text style={[
              styles.failureMessage,
              isNightMode && { color: '#cccccc' }
            ]}>
              If you were unable to complete your payment, please try again!
            </Text>

            {/* Got it Button */}
            <TouchableOpacity
              style={styles.failureButton}
              onPress={() => setShowFailureModal(false)}
            >
              <Text style={styles.failureButtonText}>Got it!</Text>
            </TouchableOpacity>

            {/* Contact Information */}
            <View style={styles.contactSection}>
              <Text style={[
                styles.contactText,
                isNightMode && { color: '#999999' }
              ]}>Please let us know if you're facing any issues</Text>
              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <Text style={styles.contactIcon}>📞</Text>
                  <Text style={[
                    styles.contactDetail,
                    isNightMode && { color: '#ffffff' }
                  ]}>+91 7208315878</Text>
                </View>
                <View style={styles.contactSeparator} />
                <View style={styles.contactItem}>
                  <Text style={styles.contactIcon}>✉️</Text>
                  <Text style={[
                    styles.contactDetail,
                    isNightMode && { color: '#ffffff' }
                  ]}>support@arthlete.fit</Text>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Credit Application Modal */}
      <Modal
        visible={showCreditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreditModal(false)}
      >
        <View style={styles.creditModalOverlay}>
          <View style={styles.creditModalContent}>
            <Text style={styles.creditModalTitle}>Apply Credits</Text>
            
            <Text style={styles.creditModalSubtitle}>
              Available Credits: {userCredits}
            </Text>
            
            <Text style={styles.creditModalDescription}>
              Apply credits to reduce your monthly plan price. Every 25 credits = ₹10 discount.
            </Text>

            <View style={styles.creditOptions}>
              <TouchableOpacity
                style={[
                  styles.creditOption,
                  appliedCredits === 0 && styles.creditOptionSelected
                ]}
                onPress={() => handleCreditApplication(0)}
              >
                <Text style={styles.creditOptionText}>No Credits</Text>
                <Text style={styles.creditOptionPrice}>₹499</Text>
              </TouchableOpacity>

              {/* Show available credits with calculated discount */}
              {userCredits > 0 && (
                <TouchableOpacity
                  style={[
                    styles.creditOption,
                    appliedCredits === userCredits && styles.creditOptionSelected
                  ]}
                  onPress={() => handleCreditApplication(userCredits)}
                >
                  <Text style={styles.creditOptionText}>{userCredits} Credits Available</Text>
                  <Text style={styles.creditOptionPrice}>₹{calculateMonthlyPrice(499, userCredits).discountedPrice}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.creditModalButtons}>
              <TouchableOpacity
                style={styles.creditModalCancelButton}
                onPress={() => setShowCreditModal(false)}
              >
                <Text style={styles.creditModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.creditModalApplyButton}
                onPress={() => setShowCreditModal(false)}
              >
                <Text style={styles.creditModalApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Keep background white
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
    position: 'relative',
    height: 70, // Reduced height
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#333', // Dark gray/black
    marginBottom: 2, // Reduced spacing
    fontFamily: 'Lexend',
  },
  headerTitle: {
    fontSize: 24,
    color: '#000', // Black text
    // fontWeight: 'bold', // Removed bold
    fontFamily: 'Lexend',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#333', // Dark gray/black
    fontFamily: 'Lexend',
  },
  reviewsSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0,
    alignItems: 'center',
    height: 130, // Increased from 110 to prevent cutting
    overflow: 'hidden',
  },
  reviewContainer: {
    width: width,
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    paddingBottom: 30,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  star: {
    fontSize: 24,
    color: '#FFD700', // Keep gold stars
  },
  reviewText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#333', // Dark gray/black
    marginBottom: 8,
    fontFamily: 'Lexend',
  },
  reviewerName: {
    fontSize: 14,
    color: '#666', // Medium gray
    fontFamily: 'Lexend',
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8, // Reduced from 15 to 8 to decrease gap
  },
  planCard: {
    borderRadius: 20,
    marginBottom: 8,
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
    paddingLeft: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardPricing: {
    alignItems: 'flex-start',
  },
  cardPrice: {
    fontSize: 28,
    // fontWeight: 'bold', // Removed bold
    fontFamily: 'Lexend',
  },
  cardPriceSubtext: {
    fontSize: 14,
    marginTop: -2,
    fontFamily: 'Lexend',
  },
  cardTitle: {
    alignItems: 'flex-end',
  },
  cardTitleText: {
    fontSize: 18,
    // fontWeight: 'bold', // Removed bold
    textAlign: 'right',
    fontFamily: 'Lexend',
  },
  popularBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  popularBadgeText: {
    fontSize: 10,
    // fontWeight: 'bold', // Removed bold
    fontFamily: 'Lexend',
  },
  expandedContent: {
    flex: 1,
    paddingLeft: 0,
    marginLeft: 0,
  },
  planDescription: {
    fontSize: 14,
    textAlign: 'left',
    marginBottom: 12,
    lineHeight: 18,
    paddingLeft: 0,
    fontFamily: 'Lexend',
  },
  featuresTitle: {
    fontSize: 16,
    // fontWeight: 'bold', // Removed bold
    marginBottom: 10,
    textAlign: 'left',
    paddingLeft: 0,
    fontFamily: 'Lexend',
  },
  featuresCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20, // Increased from 16
    width: '100%',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginLeft: 0,
    minHeight: 120, // Added minimum height
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // Increased from 8
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 10,
    // fontWeight: 'bold', // Removed bold
    color: '#FF8C42', // Light orange
  },
  featureText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 16,
    fontFamily: 'Lexend',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10, // Add some space below buttons
  },
  creditButton: {
    backgroundColor: '#FF8C42',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Equal size with payment button
    marginRight: 10,
    height: 60, // Fixed height for both buttons
    minHeight: 60, // Ensure consistent height
  },
  creditButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Lexend',
    textAlign: 'center',
  },
  creditButtonSubtext: {
    fontSize: 10,
    color: '#fff',
    marginTop: 2,
    fontFamily: 'Lexend',
    textAlign: 'center',
  },
  payButton: {
    backgroundColor: '#000',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    flex: 1, // Equal size with credit button
    marginLeft: 10,
    height: 60, // Fixed height for both buttons
    minHeight: 60, // Ensure consistent height
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 14, // Changed from 17 to match credit button
    fontWeight: 'bold', // Added bold to match credit button
    fontFamily: 'Lexend',
    textAlign: 'center', // Ensure text is centered
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100,
  },
  failureModalOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Full screen white background
    justifyContent: 'center',
    alignItems: 'center',
  },
  failureModalContent: {
    flex: 1, // Take full height
    width: '100%', // Take full width
    backgroundColor: '#fff',
    borderRadius: 0, // Remove border radius for full screen
    paddingHorizontal: width * 0.05, // 5% of screen width
    paddingVertical: height * 0.05, // 5% of screen height
    alignItems: 'center',
    justifyContent: 'flex-start', // Changed from space-between to flex-start
    paddingTop: height * 0.08, // 8% of screen height
  },
  failureIconContainer: {
    width: width * 0.2, // 20% of screen width
    height: width * 0.2, // 20% of screen width (keep it circular)
    borderRadius: width * 0.1, // 10% of screen width (half of width for perfect circle)
    backgroundColor: '#FFE5D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0, // Removed gap completely
  },
  failureIcon: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  failureExclamation: {
    fontSize: 40,
    color: '#FF8C42',
  },
  failureTitle: {
    fontSize: Math.max(width * 0.055, 18), // 5.5% of screen width, minimum 18px
    fontWeight: 'bold',
    color: '#000',
    marginBottom: height * 0.12, // 12% of screen height
    textAlign: 'center',
    fontFamily: 'Lexend',
  },
  failureMessage: {
    fontSize: Math.max(width * 0.04, 14), // 4% of screen width, minimum 14px
    color: '#333',
    textAlign: 'center',
    marginBottom: height * 0.03, // 3% of screen height
    lineHeight: Math.max(width * 0.055, 20), // 5.5% of screen width, minimum 20px
    fontFamily: 'Lexend',
  },
  failureButton: {
    backgroundColor: '#4CAF50',
    borderRadius: width * 0.05, // 5% of screen width
    paddingVertical: height * 0.015, // 1.5% of screen height
    paddingHorizontal: width * 0.075, // 7.5% of screen width
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: height * 0.05, // 5% of screen height
  },
  failureButtonText: {
    color: '#fff',
    fontSize: Math.max(width * 0.042, 16), // 4.2% of screen width, minimum 16px
    fontWeight: 'bold',
    fontFamily: 'Lexend',
  },
  contactSection: {
    marginTop: height * 0.03, // 3% of screen height
    alignItems: 'center',
  },
  contactText: {
    fontSize: Math.max(width * 0.035, 14), // 3.5% of screen width, minimum 14px
    color: '#666',
    marginBottom: height * 0.02, // 2% of screen height
    fontFamily: 'Lexend',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    fontSize: Math.max(width * 0.05, 20), // 5% of screen width, minimum 20px
    marginRight: width * 0.012, // 1.2% of screen width
  },
  contactDetail: {
    fontSize: Math.max(width * 0.035, 14), // 3.5% of screen width, minimum 14px
    color: '#000',
    fontWeight: 'bold',
    fontFamily: 'Lexend',
  },
  contactSeparator: {
    width: 1,
    height: height * 0.04, // 4% of screen height
    backgroundColor: '#ccc',
  },
  creditModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditModalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  creditModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    fontFamily: 'Lexend',
  },
  creditModalSubtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 15,
    fontFamily: 'Lexend',
  },
  creditModalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    fontFamily: 'Lexend',
  },
  creditOptions: {
    width: '100%',
    marginBottom: 20,
  },
  creditOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  creditOptionSelected: {
    backgroundColor: '#FF8C42',
    borderWidth: 1,
    borderColor: '#FF8C42',
  },
  creditOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Lexend',
  },
  creditOptionPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8C42',
    fontFamily: 'Lexend',
  },
  creditModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  creditModalCancelButton: {
    backgroundColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  creditModalCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Lexend',
  },
  creditModalApplyButton: {
    backgroundColor: '#FF8C42',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  creditModalApplyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Lexend',
  },
  appliedCreditsInfo: {
    backgroundColor: '#f8f9fa', // Lighter background
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginTop: 8,
    width: 'auto', // Auto width instead of 90%
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  appliedCreditsText: {
    fontSize: 12, // Smaller font size
    color: '#6c757d', // Muted color
    fontFamily: 'Lexend',
    textAlign: 'center',
  },
});

export default RazorpayPayment; 