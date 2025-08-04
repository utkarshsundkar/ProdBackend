import React from 'react';
import { View, Text, StyleSheet, StatusBar, Dimensions, Image, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Convert all dimensions to percentage-based
const AVATAR_SIZE = width * 0.18; // 18% of screen width
const BAR_WIDTH = width * 0.05; // 5% of screen width
const BAR_HEIGHT = height * 0.18; // 18% of screen height
const CARD_WIDTH = width * 0.32; // 32% of screen width
const CARD_HEIGHT = height * 0.07; // 7% of screen height

const AVATARS = [
  { uri: 'https://randomuser.me/api/portraits/men/1.jpg', style: { top: height * 0.10, left: width * 0.10 } },
  { uri: 'https://randomuser.me/api/portraits/men/2.jpg', style: { top: height * 0.04, left: width * 0.41 } },
  { uri: 'https://randomuser.me/api/portraits/women/1.jpg', style: { top: height * 0.10, right: width * 0.10 } },
  { uri: 'https://randomuser.me/api/portraits/women/2.jpg', style: { top: height * 0.24, left: width * 0.41 } },
];

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

export default function On1() {
  return (
    <LinearGradient
      colors={['#FE552B', '#FE552B']}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Static Dots */}
      {DOTS.map((dot, idx) => (
        <View key={idx} style={[styles.dotDecoration, dot]} />
      ))}

      {/* Concentric Circles */}
      <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
        <Circle cx={width / 2} cy={height * 0.32} r={width * 0.3} stroke="#fff" strokeOpacity={0.05} strokeWidth="2" fill="none" />
        <Circle cx={width / 2} cy={height * 0.32} r={width * 0.2} stroke="#fff" strokeOpacity={0.07} strokeWidth="2" fill="none" />
        <Circle cx={width / 2} cy={height * 0.32} r={width * 0.1} stroke="#fff" strokeOpacity={0.09} strokeWidth="2" fill="none" />
      </Svg>
      
      {/* Main Title and Subtitle - fixed position */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>Stay Together and Strong</Text>
        <Text style={styles.subtitle}>Find friends to discuss common topics. Complete challenges together.</Text>
      </View>
      {/* Avatars and Streak Card Group - absolutely positioned above text */}
      <View style={styles.avatarStreakGroup}>
        {/* Left avatar */}
        <Image source={{ uri: AVATARS[0].uri }} style={[styles.avatarCircle, { left: width * 0.10, top: AVATAR_SIZE * 0.4 }]} />
        {/* Top center avatar */}
        <Image source={{ uri: AVATARS[1].uri }} style={[styles.avatarCircle, { left: width * 0.41, top: -AVATAR_SIZE * 1.1 }]} />
        {/* Right avatar */}
        <Image source={{ uri: AVATARS[2].uri }} style={[styles.avatarCircle, { right: width * 0.10, top: AVATAR_SIZE * 0.4, position: 'absolute' }]} />
        {/* Streak Card Centered */}
        <View style={styles.streakCardCentered}>
          <Text style={styles.streakLabel}>BEST STREAK DAY</Text>
          <Text style={styles.streakValue}>22</Text>
        </View>
        {/* Bottom avatar, just above the text */}
        <Image source={{ uri: AVATARS[3].uri }} style={[styles.avatarCircle, { left: width / 2 - AVATAR_SIZE / 2, top: AVATAR_SIZE * 1.5 }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#eee',
  },
  decoration: {
    position: 'absolute',
    backgroundColor: '#fff',
  },
  wavyLine: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '10%',
  },
  streakCard: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 2,
  },
  streakLabel: {
    color: '#7B61FF',
    fontSize: Math.max(width * 0.028, 11), // Responsive font size, minimum 11
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: 'Lexend',
  },
  streakValue: {
    color: '#1E3CFF',
    fontSize: Math.max(width * 0.045, 18), // Responsive font size, minimum 18
    fontWeight: 'bold',
    marginTop: height * 0.002, // 0.2% of screen height
    fontFamily: 'Lexend',
  },
  dotDecoration: {
    position: 'absolute',
    backgroundColor: '#fff',
    zIndex: 0,
  },
  avatarStreakGroup: {
    position: 'absolute',
    width: '100%',
    left: 0,
    // Place the group just above the text block using percentage
    bottom: height * 0.36 + height * 0.15, // 36% + 15% of screen height
    height: AVATAR_SIZE * 2.5,
    zIndex: 10,
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: Math.max(width * 0.008, 3), // Responsive border width, minimum 3
    borderColor: '#fff',
    backgroundColor: '#eee',
    position: 'absolute',
    zIndex: 2,
  },
  streakCardCentered: {
    position: 'absolute',
    top: AVATAR_SIZE * 0.45,
    left: width / 2 - CARD_WIDTH / 2,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: Math.max(width * 0.035, 14), // Responsive border radius, minimum 14
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: Math.max(width * 0.02, 8), // Responsive shadow radius, minimum 8
    elevation: 4,
    zIndex: 3,
  },
  textBlock: {
    alignItems: 'center',
    position: 'absolute',
    bottom: height * 0.32, // 32% from bottom
    width: '100%',
    paddingHorizontal: width * 0.04, // 4% of screen width
    zIndex: 20,
  },
  title: {
    color: '#fff',
    fontSize: Math.max(width * 0.08, 32), // Responsive font size, minimum 32
    //fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: height * 0.01, // 1% of screen height
    lineHeight: Math.max(width * 0.095, 38), // Responsive line height, minimum 38
    fontFamily: 'Lexend',
  },
  subtitle: {
    color: '#e0e0e0',
    fontSize: Math.max(width * 0.042, 17), // Responsive font size, minimum 17
    textAlign: 'center',
    marginBottom: 0,
    marginTop: height * 0.005, // 0.5% of screen height
    paddingHorizontal: width * 0.04, // 4% of screen width
    fontFamily: 'Lexend',
  },
}); 