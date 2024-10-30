import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Custom component for the date icon (weekday on top, date below)
const DateIcon = ({ weekday, date }) => {
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.weekday}>{weekday}</Text>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.date}>{date}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  top: {
    flex: 11,
    justifyContent: 'center',
    backgroundColor: 'red',
    width: '100%',
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  bottom: {
    flex: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekday: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  date: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default DateIcon;