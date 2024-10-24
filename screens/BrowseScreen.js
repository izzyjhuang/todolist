// screens/BrowseScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BrowseScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Browse Templates</Text>
      <Text>Browse templates and manage projects.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default BrowseScreen;