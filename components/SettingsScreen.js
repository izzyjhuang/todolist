import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import getUserId from './firebase';
import QRCode from 'react-native-qrcode-svg';

const SettingsScreen = () => {
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await getUserId();
      setUserId(id);
    };
    fetchUserId();
  }, []);

  return (
    <View>
      <Text>Scan this QR code to sync your devices:</Text>
      {userId ? <QRCode value={userId} size={200} /> : <Text>Loading...</Text>}
    </View>
  );
};

export default SettingsScreen;