import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { BASE_URL } from '../api.js';

const PaymentModal = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '₹249',
      originalPrice: '₹499',
      savings: '50% OFF',
      duration: '1 Month',
      features: [
        'Unlimited Workouts',
        'Premium Exercises',
        'Progress Tracking',
        'Custom Plans',
        'Priority Support'
      ]
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: '₹2,499',
      originalPrice: '₹5,988',
      savings: '58% OFF',
      duration: '12 Months',
      features: [
        'Everything in Monthly',
        'Advanced Analytics',
        'Personal Coach',
        'Nutrition Plans',
        'Early Access Features'
      ]
    }
  ];

  const handlePayment = async () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a plan first');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create order on your backend
      const orderResponse = await fetch(`${BASE_URL}/api/v1/payment/createorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          planType: selectedPlan.id
        })
      });

      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      // Step 2: Open Razorpay payment URL
      const paymentUrl = `https://checkout.razorpay.com/v1/checkout.html?key=${orderData.data.razorpayKey}&amount=${orderData.data.order.amount}&currency=${orderData.data.order.currency}&name=Fitness%20App%20Premium&description=${encodeURIComponent(selectedPlan.name + ' - ' + selectedPlan.duration)}&order_id=${orderData.data.order.id}&prefill[email]=user@example.com&prefill[contact]=9999999999&theme[color]=4CAF50&callback_url=${encodeURIComponent(BASE_URL + '/api/v1/payment/verifyPayment')}&cancel_url=${encodeURIComponent(BASE_URL + '/payment-cancelled')}`;

      // Open payment URL in browser
      const supported = await Linking.canOpenURL(paymentUrl);
      if (supported) {
        await Linking.openURL(paymentUrl);
      } else {
        Alert.alert('Error', 'Cannot open payment gateway');
      }

    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    // Implement this to get your JWT token from storage
    // Example: return await AsyncStorage.getItem('authToken');
    return 'your-auth-token-here';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Plan</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.plansContainer}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan?.id === plan.id && styles.selectedPlan
                ]}
                onPress={() => setSelectedPlan(plan)}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>{plan.savings}</Text>
                  </View>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{plan.price}</Text>
                  <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
                  <Text style={styles.duration}>/{plan.duration}</Text>
                </View>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Text style={styles.featureText}>✓ {feature}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.payButton,
              !selectedPlan && styles.payButtonDisabled
            ]}
            onPress={handlePayment}
            disabled={!selectedPlan || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>
                {selectedPlan ? `Pay ${selectedPlan.price}` : 'Select a Plan'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#666',
  },
  plansContainer: {
    marginBottom: 20,
  },
  planCard: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  selectedPlan: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  savingsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  savingsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 10,
  },
  duration: {
    fontSize: 16,
    color: '#666',
    marginLeft: 5,
  },
  featuresContainer: {
    marginTop: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#555',
  },
  payButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PaymentModal; 