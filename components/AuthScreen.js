// components/AuthScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { auth } from '../firebase'; // Import Firebase auth from firebase.js

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Sign up function
  const signUp = async () => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      setUser(userCredential.user);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Sign in function
  const signIn = async () => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      setUser(userCredential.user);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <View>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" value={password} secureTextEntry onChangeText={setPassword} />
      <Button title="Sign Up" onPress={signUp} />
      <Button title="Sign In" onPress={signIn} />
      {user && <Text>Welcome, {user.email}</Text>}
      {errorMessage && <Text>{errorMessage}</Text>}
    </View>
  );
};

export default AuthScreen;