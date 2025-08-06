import React, { useState, useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from './screens/HomeScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import FocusScreen from './screens/FocusScreen';
import { BASE_URL } from './src/api.js';
import { useNightMode } from './context/NightModeContext';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { isNightMode } = useNightMode();
  
  return (
    <View style={[
      styles.tabBarContainer, 
      { 
        backgroundColor: Platform.OS === 'ios' 
          ? (isNightMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)')
          : (isNightMode ? '#000' : '#fff'),
        paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0,
      }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;
        const isFocused = state.index === index;
        const icon = route.name === 'Home' ? '🏠' : route.name === 'Workouts' ? '🎯' : '🧘';

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={styles.tabButton}
          >
            <Text style={[
              styles.tabLabel,
              {
                color: Platform.OS === 'ios' 
                  ? (isFocused ? '#007AFF' : (isNightMode ? '#fff' : '#333'))
                  : (isFocused ? (isNightMode ? '#fff' : '#000') : (isNightMode ? '#fff' : '#444')),
                fontWeight: 'bold',
                opacity: isFocused ? 1 : 0.8
              }
            ]}>
              {label}
            </Text>
            {isFocused && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const MainTabs = () => {
  const { user } = useContext(AuthContext);
  const userId = user?._id || user?.id;
  const alreadyChecked = useRef(false);
  const { isNightMode, setIsNightMode } = useNightMode();
  const [inFocusMode, setInFocusMode] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const runFocusSessionCheck = async () => {
      if (alreadyChecked.current) return;
      try {
        if (!userId) return;
        alreadyChecked.current = true;
        const res = await fetch(`${BASE_URL}/focus/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        // console.log("🔁 Focus session check result:", data.message);
      } catch (error) {
        // console.error("❌ Focus session check failed:", error.message);
      }
    };
    runFocusSessionCheck();
  }, []);

  return (
    <Tab.Navigator
      tabBar={props => (inFocusMode ? null : <CustomTabBar {...props} />)}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Explore"
        options={{ tabBarLabel: "Explore" }}
        children={() => <HomeScreen />}
      />
      <Tab.Screen
        name="Workouts"
        children={() => <WorkoutScreen />}
      />
      <Tab.Screen
        name="Focus"
        children={() => (
          <FocusScreen
            inFocusMode={inFocusMode}
            setInFocusMode={setInFocusMode}
          />
        )}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.9)' : '#000',
    height: Platform.OS === 'ios' ? 88 : 64,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderTopColor: Platform.OS === 'ios' ? '#E5E5E7' : '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0.1,
    shadowRadius: Platform.OS === 'ios' ? 8 : 4,
    elevation: 10,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: Platform.OS === 'ios' ? 14 : 16,
    fontWeight: 'bold',
    letterSpacing: Platform.OS === 'ios' ? 0.5 : 1,
    color: Platform.OS === 'ios' ? '#007AFF' : '#000',
  },
  tabUnderline: {
    marginTop: Platform.OS === 'ios' ? 4 : 3,
    height: Platform.OS === 'ios' ? 2 : 3,
    width: Platform.OS === 'ios' ? 20 : 28,
    backgroundColor: Platform.OS === 'ios' ? '#007AFF' : '#FFA726',
    borderRadius: Platform.OS === 'ios' ? 1 : 2,
  },
});
