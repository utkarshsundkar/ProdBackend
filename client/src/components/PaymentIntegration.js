import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import RazorpayPayment from './RazorpayPayment';

const PaymentIntegration = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePaymentSuccess = () => {
    // Handle successful payment
    Alert.alert('Success', 'Payment completed successfully!');
    // Update user's premium status
    // Refresh user data
    // Navigate to premium features
  };

  const handleUpgradeToPremium = () => {
    setShowPaymentModal(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upgrade to Premium</Text>
      <Text style={styles.description}>
        Get access to unlimited workouts, premium exercises, and advanced features!
      </Text>
      
      <TouchableOpacity 
        style={styles.upgradeButton}
        onPress={handleUpgradeToPremium}
      >
        <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
      </TouchableOpacity>

      {/* Payment Modal */}
      <RazorpayPayment
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  upgradeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PaymentIntegration; 