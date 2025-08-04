import React from 'react';
import { View, Text, StyleSheet, StatusBar, Dimensions, Image, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const DOTS = Array.from({ length: 80 }).map(() => {
  const size = Math.random() * 4 + 1;
  return {
    left: Math.random() * width,
    top: Math.random() * height,
    width: size,
    height: size,
    borderRadius: size / 2,
    opacity: Math.random() * 0.5 + 0.1,
  };
});

export default function On6() {
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#FE552B", "#FE552B"]}
        style={styles.container}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#FE552B" translucent />
        {/* Static Dots */}
        {DOTS.map((dot, idx) => (
          <View key={idx} style={[styles.dotDecoration, dot]} />
        ))}
        {/* Concentric Circles */}
        <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
          <Circle cx={width / 2} cy={height * 0.32} r={width * 0.3} stroke="#F5F6FA" strokeOpacity={0.08} strokeWidth="2" fill="none" />
          <Circle cx={width / 2} cy={height * 0.32} r={width * 0.2} stroke="#F5F6FA" strokeOpacity={0.12} strokeWidth="2" fill="none" />
          <Circle cx={width / 2} cy={height * 0.32} r={width * 0.1} stroke="#F5F6FA" strokeOpacity={0.18} strokeWidth="2" fill="none" />
        </Svg>
        {/* Title */}
        <Text style={styles.title}>Custom{"\n"}Workout</Text>
        {/* Workout Card - Centered in solar rings */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Image source={{ uri: 'https://img.icons8.com/color/48/000000/calendar--v1.png' }} style={styles.cardIcon} />
            <View>
              <Text style={styles.cardDay}>Monday</Text>
              <Text style={styles.cardType}>Full Body</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={styles.editDayBtn}><Text style={styles.editDayText}>Edit Day</Text></TouchableOpacity>
            <TouchableOpacity style={styles.addExBtn}><Text style={styles.addExText}>Add Exercises</Text></TouchableOpacity>
          </View>
        </View>
        {/* Main Text */}
        <View style={styles.textBlock}>
          <Text style={styles.mainTitle}>Your Goals{"\n"}Your Plan</Text>
          <Text style={styles.subText}>Build custom workouts tailored to your fitness goals whether it's fat loss, muscle gain, or endurance.\nWe adapt to you, not the other way around.</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dotDecoration: {
    position: 'absolute',
    backgroundColor: '#fff',
    zIndex: 0,
  },
  title: {
    color: '#fff',
    fontSize: Math.max(width * 0.07, 28),
    // fontWeight: 'bold',
    textAlign: 'left',
    marginTop: height * 0.07,
    marginLeft: width * 0.06,
    marginBottom: height * 0.03,
    letterSpacing: 1.5,
    zIndex: 20,
    fontFamily: 'Lexend',
  },
  card: {
    position: 'absolute',
    top: height * 0.32 - height * 0.08, // Center of circles (32%) minus half the card height (8%)
    left: width / 2 - width * 0.4, // Center horizontally, card width is 80% of screen width
    width: width * 0.8, // 80% of screen width
    backgroundColor: '#fff',
    borderRadius: Math.max(width * 0.04, 16), // Responsive border radius, minimum 16
    padding: width * 0.04, // 4% of screen width
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: Math.max(width * 0.02, 8), // Responsive shadow radius, minimum 8
    elevation: 2,
    zIndex: 15, // Higher z-index to appear above dots but below title
  },
  cardIcon: {
    width: Math.max(width * 0.08, 32), // Responsive icon size, minimum 32
    height: Math.max(width * 0.08, 32), // Responsive icon size, minimum 32
    marginRight: width * 0.03, // 3% of screen width
  },
  cardDay: {
    color: '#222',
    // fontWeight: 'bold',
    fontSize: Math.max(width * 0.04, 16),
    fontFamily: 'Lexend',
  },
  cardType: {
    color: '#888',
    fontSize: Math.max(width * 0.032, 13), // Responsive font size, minimum 13
    marginTop: height * 0.002, // 0.2% of screen height
  },
  editDayBtn: {
    backgroundColor: '#eee',
    borderRadius: Math.max(width * 0.02, 8), // Responsive border radius, minimum 8
    paddingVertical: height * 0.007, // 0.7% of screen height
    paddingHorizontal: width * 0.045, // 4.5% of screen width
    marginRight: width * 0.02, // 2% of screen width
  },
  editDayText: {
    color: '#222',
    // fontWeight: 'bold',
    fontSize: Math.max(width * 0.035, 14),
    fontFamily: 'Lexend',
  },
  addExBtn: {
    backgroundColor: '#3E4DB8',
    borderRadius: Math.max(width * 0.02, 8), // Responsive border radius, minimum 8
    paddingVertical: height * 0.007, // 0.7% of screen height
    paddingHorizontal: width * 0.045, // 4.5% of screen width
  },
  addExText: {
    color: '#fff',
    // fontWeight: 'bold',
    fontSize: Math.max(width * 0.035, 14),
    fontFamily: 'Lexend',
  },
  textBlock: {
    width: '100%',
    position: 'absolute',
    bottom: height * 0.28, // 28% from bottom (increased to avoid overlap)
    alignItems: 'flex-start',
    paddingHorizontal: width * 0.06, // 6% of screen width
    marginTop: height * 0.02, // 2% of screen height
    zIndex: 30, // Highest z-index to appear above everything
  },
  mainTitle: {
    color: '#fff',
    fontSize: Math.max(width * 0.06, 24),
    // fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: height * 0.012,
    marginTop: height * 0.012,
    zIndex: 30,
    fontFamily: 'Lexend',
  },
  subText: {
    color: '#fff',
    fontSize: Math.max(width * 0.035, 14),
    textAlign: 'left',
    opacity: 0.9,
    marginTop: 0,
    zIndex: 30,
    fontFamily: 'Lexend',
  },
}); 