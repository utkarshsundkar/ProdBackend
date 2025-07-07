import React, {useContext} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import Onboarding from '../screens/Onboarding';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgetPassword from '../screens/ForgetPassword';
import SecurityQuestions from '../screens/SecurityQuestions';
import NewPassword from '../screens/NewPassword';
import AuthContext from '../context/AuthContext';

const Stack = createStackNavigator();

const AppNavigation = () => {
  const {user, loading} = useContext(AuthContext);

  if (loading) {
    // While checking token, show splash
    return <SplashScreen navigation={{replace: () => {}}} />;
  }

  return (
    <NavigationContainer key={user ? 'nav-logged-in' : 'nav-logged-out'}>
      <Stack.Navigator
        key={user ? 'user-logged-in' : 'user-logged-out'}
        initialRouteName={user ? 'Home' : 'Onboarding'}
      >
        {!user && (
          <>
            <Stack.Screen
              name="Onboarding"
              component={Onboarding}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Sign In"
              component={LoginScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
        <Stack.Screen
          name="SecurityQuestions"
          component={SecurityQuestions}
        />
        <Stack.Screen name="NewPassword" component={NewPassword} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;
