import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const RedBar = ({ blocks }) => {
  const [currentPosition, setCurrentPosition] = useState({ top: 0, blockId: null });

  // Function to calculate the vertical position of the red bar
  const calculatePosition = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let foundBlock = null;
    let blockIndex = 0;

    // Iterate through blocks to find where the current time falls
    for (const block of blocks) {
      const [startTime, endTime] = block.time.split('-');
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const currentBlockStartMinutes = startHour * 60 + startMinute;
      const currentBlockEndMinutes = endHour * 60 + endMinute;

      if (currentMinutes >= currentBlockStartMinutes && currentMinutes < currentBlockEndMinutes) {
        foundBlock = block;
        break;
      }
      blockIndex++;
    }

    if (foundBlock) {
      const blockHeight = Dimensions.get('window').height / blocks.length; // Assuming equal block height
      const [startTime, endTime] = foundBlock.time.split('-');
      const [startHour, startMinute] = startTime.split(':').map(Number);

      const currentBlockStartMinutes = startHour * 60 + startMinute;
      const elapsedMinutes = currentMinutes - currentBlockStartMinutes;

      const [endHour, endMinute] = endTime.split(':').map(Number);
      const currentBlockEndMinutes = endHour * 60 + endMinute;
      const blockDuration = currentBlockEndMinutes - currentBlockStartMinutes;

      const positionInBlock = (elapsedMinutes / blockDuration) * blockHeight;

      setCurrentPosition({ blockId: foundBlock.id, top: blockIndex * blockHeight + positionInBlock });
    }
  };

  useEffect(() => {
    calculatePosition(); // Run once on mount

    const interval = setInterval(() => {
      calculatePosition(); // Update every minute
    }, 60000); // Update every minute

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [blocks]);

  return (
    <View style={[styles.redBar, { top: currentPosition.top }]} />
  );
};

const styles = StyleSheet.create({
  redBar: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'red',
    width: '100%',
  },
});

export default RedBar;