import React, {useState, useContext} from 'react';
import {View, Text, TextInput, Button, StyleSheet} from 'react-native';
import {AuthContext} from '../context/AuthContext.js';

export default function RegisterScreen({navigation}) {
  const {register} = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setfullName] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <Text>Email</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <Text>Username</Text>
      <TextInput
        placeholder="username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <Text>fullname</Text>
      <TextInput
        placeholder="fullName"
        value={fullName}
        onChangeText={setfullName}
        style={styles.input}
      />
      <Text>Password</Text>
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button
        title="Register"
        onPress={() => register(email, username, fullName, password)}
      />
      <Text onPress={() => navigation.navigate('Login')} style={styles.link}>
        Already have an account? Login
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', padding: 20},
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {borderWidth: 1, padding: 10, marginVertical: 10, borderRadius: 5},
  link: {marginTop: 10, color: 'blue', textAlign: 'center'},
});
