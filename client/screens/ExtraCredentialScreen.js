import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';

const ExtraCredentialScreen = () => {
  const navigation = useNavigation();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Extra Credential Screen</Text>
      <TouchableOpacity
        style={{ marginTop: 24, backgroundColor: '#2563FF', padding: 16, borderRadius: 8 }}
        onPress={() => navigation.replace('Gender')}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Start Onboarding</Text>
      </TouchableOpacity>
    </View>
  )
}

export default ExtraCredentialScreen