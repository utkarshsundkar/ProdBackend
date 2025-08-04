# Razorpay Integration Setup Guide

## Prerequisites
- React Native project
- Razorpay account with API keys
- Backend server with payment endpoints

## Step 1: Install Razorpay React Native SDK

```bash
# Install the Razorpay React Native SDK
npm install react-native-razorpay

# For iOS, install pods
cd ios && pod install && cd ..
```

## Step 2: Android Configuration

### Add to `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        // ... other configs
        missingDimensionStrategy 'react-native-razorpay', 'general'
    }
}
```

### Add to `android/settings.gradle`:
```gradle
include ':react-native-razorpay'
project(':react-native-razorpay').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-razorpay/android')
```

### Add to `android/app/src/main/java/com/yourapp/MainApplication.java`:
```java
import com.razorpay.rn.RazorpayPackage;

// In getPackages() method:
@Override
protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
        new RazorpayPackage() // Add this line
    );
}
```

## Step 3: iOS Configuration

### Add to `ios/Podfile`:
```ruby
target 'YourApp' do
  # ... other pods
  pod 'razorpay-pod'
end
```

### Run pod install:
```bash
cd ios && pod install && cd ..
```

## Step 4: Environment Variables

### Add to your `.env` file:
```
RAZORPAY_KEY_ID=rzp_test_your_test_key_here
RAZORPAY_SECRET_KEY=your_secret_key_here
```

## Step 5: Backend Configuration

Your backend should have these endpoints:

### 1. Create Order Endpoint
```
POST /api/v1/payment/createorder
Body: { "planType": "monthly" | "yearly" }
```

### 2. Verify Payment Endpoint
```
POST /api/v1/payment/verifyPayment
Body: {
  "razorpay_order_id": "...",
  "razorpay_payment_id": "...",
  "razorpay_signature": "...",
  "planType": "monthly" | "yearly",
  "paymentId": "...",
  "method": "razorpay"
}
```

## Step 6: Frontend Integration

### 1. Import the Payment Component:
```javascript
import RazorpayPayment from './src/components/RazorpayPayment';
```

### 2. Use in your screen:
```javascript
const [showPaymentModal, setShowPaymentModal] = useState(false);

const handlePaymentSuccess = () => {
  // Handle successful payment
  Alert.alert('Success', 'Payment completed!');
  // Update user premium status
  // Refresh user data
};

// In your JSX:
<RazorpayPayment
  visible={showPaymentModal}
  onClose={() => setShowPaymentModal(false)}
  onSuccess={handlePaymentSuccess}
/>
```

## Step 7: Authentication Token

### Update the `getAuthToken` function in `RazorpayPayment.js`:
```javascript
const getAuthToken = async () => {
  // Get your JWT token from storage
  return await AsyncStorage.getItem('authToken');
};
```

## Step 8: Testing

### Test Mode:
- Use Razorpay test keys
- Test with these card numbers:
  - Success: 4111 1111 1111 1111
  - Failure: 4000 0000 0000 0002

### Production Mode:
- Switch to live keys
- Update environment variables

## Step 9: Error Handling

The component handles these scenarios:
- Payment cancellation
- Network errors
- Invalid signatures
- Backend errors

## Step 10: Customization

### Update Plan Details:
Edit the `plans` array in `RazorpayPayment.js`:
```javascript
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
      // Add more features
    ]
  }
];
```

### Update Styling:
Modify the `styles` object in `RazorpayPayment.js` to match your app's theme.

## Troubleshooting

### Common Issues:

1. **"RazorpayCheckout is not defined"**
   - Ensure SDK is properly installed
   - Check import statement

2. **"Invalid key" error**
   - Verify your Razorpay key is correct
   - Check environment variables

3. **"Order creation failed"**
   - Check backend API endpoint
   - Verify authentication token
   - Check network connectivity

4. **"Payment verification failed"**
   - Check signature verification logic
   - Verify backend verification endpoint

## Security Notes

1. Never expose your secret key in frontend code
2. Always verify payments on the backend
3. Use HTTPS in production
4. Implement proper error handling
5. Log payment events for debugging

## Support

- Razorpay Documentation: https://razorpay.com/docs/
- React Native SDK: https://github.com/razorpay/react-native-razorpay
- Backend Integration: https://razorpay.com/docs/api/ 