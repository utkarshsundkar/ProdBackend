import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthContext from '../context/AuthContext';

interface ProfileScreenProps {
  isNightMode?: boolean;
  setIsNightMode?: (value: boolean) => void;
}

const ProfileScreen = ({ isNightMode = false, setIsNightMode }: ProfileScreenProps) => {
  const navigation = useNavigation();
  const { logout, user } = useContext(AuthContext);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // @ts-ignore - Navigation type issue
              navigation.navigate('Login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, isNightMode && { backgroundColor: '#111' }]}>
      <StatusBar barStyle={isNightMode ? "light-content" : "dark-content"} backgroundColor={isNightMode ? "#111" : "#FF6B35"} />
      
      {/* Header */}
      <View style={[styles.header, isNightMode && { backgroundColor: '#222', borderBottomColor: '#333' }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, isNightMode && { color: '#fff' }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isNightMode && { color: '#fff' }]}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, isNightMode && { backgroundColor: '#222', borderColor: '#fff' }]}>
          <View style={[styles.avatarContainer, isNightMode && { backgroundColor: '#FF6B35' }]}>
            <Text style={styles.avatarInitial}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={[styles.userName, isNightMode && { color: '#fff' }]}>{user?.username || user?.name || 'User'}</Text>
          <Text style={[styles.userEmail, isNightMode && { color: '#ccc' }]}>{user?.email || 'user@example.com'}</Text>
          <View style={[styles.statusIndicator, isNightMode && { backgroundColor: '#333' }]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, isNightMode && { backgroundColor: '#222', borderColor: '#fff' }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, isNightMode && { color: '#FF6B35' }]}>0</Text>
            <Text style={[styles.statLabel, isNightMode && { color: '#ccc' }]}>Workouts</Text>
          </View>
          <View style={[styles.statDivider, isNightMode && { backgroundColor: '#333' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, isNightMode && { color: '#FF6B35' }]}>0</Text>
            <Text style={[styles.statLabel, isNightMode && { color: '#ccc' }]}>Credits</Text>
          </View>
          <View style={[styles.statDivider, isNightMode && { backgroundColor: '#333' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, isNightMode && { color: '#FF6B35' }]}>0</Text>
            <Text style={[styles.statLabel, isNightMode && { color: '#ccc' }]}>Days</Text>
          </View>
        </View>

        {/* Account Info */}
        <View style={[styles.section, isNightMode && { backgroundColor: '#222', borderColor: '#fff' }]}>
          <Text style={[styles.sectionTitle, isNightMode && { color: '#fff' }]}>Account Information</Text>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, isNightMode && { backgroundColor: '#333' }]}>
              <Text style={[styles.iconText, isNightMode && { color: '#ccc' }]}>JOIN</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, isNightMode && { color: '#ccc' }]}>Member Since</Text>
              <Text style={[styles.infoValue, isNightMode && { color: '#fff' }]}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Logout Button - Fixed at bottom */}
      <View style={[styles.logoutContainer, isNightMode && { backgroundColor: '#111' }]}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#000',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#000',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingIconText: {
    fontSize: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtext: {
    fontSize: 14,
    color: '#666',
  },
  settingArrow: {
    fontSize: 18,
    color: '#CCC',
    fontWeight: '300',
  },
  logoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: '#FAFAFA',
  },
  logoutButton: {
    backgroundColor: '#BE1600',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ProfileScreen; 