// SettingsModal.js

import React, { useState } from 'react';
import { View, Text, Modal, Button, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
// List of time zones with their respective UTC offsets
const timeZoneList = [
  { label: "Pacific Time (UTC-7)", value: "PST" },
  { label: "Mountain Time (UTC-6)", value: "MST" },
  { label: "Central Time (UTC-5)", value: "CST" },
  { label: "Eastern Time (UTC-4)", value: "EST" },
];

// Time options for Day Starts and Day Ends
const dayStartOptions = ['5:00', '6:00', '7:00', '8:00'];
const dayEndOptions = ['21:00', '22:00', '23:00', '0:00'];

const SettingsModal = ({
  visible,
  onClose,
  selectedDayStart, // Passed from parent
  selectedDayEnd,   // Passed from parent
  setSelectedDayStart, // Passed from parent
  setSelectedDayEnd,   // Passed from parent
  timeInterval,
  setTimeInterval,
  customPriorities,
  setCustomPriorities,
  updateTimeBlocks,
}) => {
    const [colorPaletteVisible, setColorPaletteVisible] = useState(null); // Track the visible color palette
    const [intervalVisible, setIntervalVisible] = useState(false); // Track schedule interval dropdown
    const [timeZoneVisible, setTimeZoneVisible] = useState(false); // Track time zone dropdown
    const [selectedTimeZone, setSelectedTimeZone] = useState('PST'); // Default to Pacific Time
    const [dayStartVisible, setDayStartVisible] = useState(false); // Track day starts dropdown visibility
    const [dayEndVisible, setDayEndVisible] = useState(false); // Track day ends dropdown visibility
    // const [selectedDayStart, setSelectedDayStart] = useState(selectedDayStart || '6:00');
    // const [selectedDayEnd, setSelectedDayEnd] = useState(selectedDayEnd || '23:00');
  
  
    const handleSaveSettings = () => {
        updateTimeBlocks(timeInterval, selectedDayStart, selectedDayEnd); // Pass day start and end times
        onClose();
    };

  // Function to add a new priority item
  const addNewPriority = () => {
    const newKey = `p${Object.keys(customPriorities).length + 1}`;
    setCustomPriorities((prev) => ({
      ...prev,
      [newKey]: { label: newKey, color: '#D3D3D3' }, // Default to grey
    }));
  };

  // Function to handle color selection
  const handleColorSelect = (priorityKey, color) => {
    setCustomPriorities((prev) => ({
      ...prev,
      [priorityKey]: { ...prev[priorityKey], color },
    }));
    setColorPaletteVisible(null); // Hide the color palette after selection
  };

  // Render the color palette
  const renderColorPalette = (priorityKey) => {
    const colors = ['#D6B4FC', '#FF8184', '#FDAA48', '#FFFFC5', '#D1FFBD', '#90D5FF', '#D3D3D3'];

    return (
      <View style={styles.colorPalette}>
        {colors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[styles.colorOption, { backgroundColor: color }]}
            onPress={() => handleColorSelect(priorityKey, color)}
          />
        ))}
      </View>
    );
  };

  const renderPriorityButton = (priorityKey) => {
    const priority = customPriorities[priorityKey];
    return (
      <View key={priorityKey} style={styles.priorityBlock}>
        <View style={styles.priorityRow}>
          {/* Priority Color Button */}
          <TouchableOpacity
            style={[styles.priorityButton, { backgroundColor: priority.color }]}
            onPress={() =>
              setColorPaletteVisible((prev) => (prev === priorityKey ? null : priorityKey))
            }
          >
            <Text style={styles.priorityButtonText}>{priority.label}</Text>
          </TouchableOpacity>

          {/* Text input for label name */}
          <TextInput
            style={styles.priorityInput}
            value={customPriorities[priorityKey].label}
            onChangeText={(text) =>
              setCustomPriorities((prev) => ({
                ...prev,
                [priorityKey]: { ...prev[priorityKey], label: text },
              }))
            }
          />

          {/* Delete button */}
          <TouchableOpacity
            onPress={() => {
              const newPriorities = { ...customPriorities };
              delete newPriorities[priorityKey];
              setCustomPriorities(newPriorities);
            }}
          >
            <Text style={styles.deleteButton}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {/* Render the color palette below the priority row if visible */}
        {colorPaletteVisible === priorityKey && renderColorPalette(priorityKey)}
      </View>
    );
  };

  // Day Starts Dropdown
  const renderDayStartOptions = () => {
    return (
      <View style={styles.timeZonePalette}>
        {dayStartOptions.map((start) => (
          <TouchableOpacity
            key={start}
            style={styles.timeZoneOption}
            onPress={() => {
              setSelectedDayStart(start);
              setDayStartVisible(false);
            }}
          >
            <Text style={styles.intervalText}>{start}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Day Ends Dropdown
  const renderDayEndOptions = () => {
    return (
      <View style={styles.timeZonePalette}>
        {dayEndOptions.map((end) => (
          <TouchableOpacity
            key={end}
            style={styles.timeZoneOption}
            onPress={() => {
              setSelectedDayEnd(end);
              setDayEndVisible(false);
            }}
          >
            <Text style={styles.intervalText}>{end}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Schedule Interval Selector (similar to color palette)
  const renderIntervalOptions = () => {
    const intervals = [10, 15, 20, 30];

    return (
      <View style={styles.intervalPalette}>
        {intervals.map((interval) => (
          <TouchableOpacity
            key={interval}
            style={styles.intervalOption}
            onPress={() => {
              setTimeInterval(interval);
              setIntervalVisible(false); // Hide interval options after selection
            }}
          >
            <Text style={styles.intervalText}>{`${interval} mins`}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Time Zone Selector (similar to schedule interval)
  const renderTimeZoneOptions = () => {
    return (
      <View style={styles.timeZonePalette}>
        {timeZoneList.map((zone) => (
          <TouchableOpacity
            key={zone.value}
            style={styles.timeZoneOption}
            onPress={() => {
              setSelectedTimeZone(zone.value);
              setTimeZoneVisible(false); // Hide time zone options after selection
            }}
          >
            <Text style={styles.intervalText}>{zone.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.header}>Settings</Text>

            <Text style={styles.subHeader}>Time Zone:</Text>
            <TouchableOpacity
              style={styles.intervalButton}
              onPress={() => setTimeZoneVisible((prev) => !prev)}
            >
              <Text style={styles.intervalButtonText}>
                {timeZoneList.find((tz) => tz.value === selectedTimeZone)?.label}
              </Text>
            </TouchableOpacity>
            {timeZoneVisible && renderTimeZoneOptions()}

            <Text style={styles.subHeader}>Schedule Interval:</Text>
            <TouchableOpacity
              style={styles.intervalButton}
              onPress={() => setIntervalVisible((prev) => !prev)}
            >
              <Text style={styles.intervalButtonText}>{`${timeInterval} mins`}</Text>
            </TouchableOpacity>
            {intervalVisible && renderIntervalOptions()}

            <View style={styles.dayTimeContainer}>
              <View style={styles.dayTimeBlock}>
                <Text style={styles.subHeader}>Day Starts:</Text>
                <TouchableOpacity
                  style={styles.intervalButton}
                  onPress={() => setDayStartVisible((prev) => !prev)}
                >
                  <Text style={styles.intervalButtonText}>{selectedDayStart}</Text>
                </TouchableOpacity>
                {dayStartVisible && renderDayStartOptions()}
              </View>
              <View style={styles.dayTimeBlock}>
                <Text style={styles.subHeader}>Day Ends:</Text>
                <TouchableOpacity
                  style={styles.intervalButton}
                  onPress={() => setDayEndVisible((prev) => !prev)}
                >
                  <Text style={styles.intervalButtonText}>{selectedDayEnd}</Text>
                </TouchableOpacity>
                {dayEndVisible && renderDayEndOptions()}
              </View>
            </View>

            <Text style={styles.subHeader}>Priority Labels:</Text>
            {Object.keys(customPriorities).map(renderPriorityButton)}

            <TouchableOpacity onPress={addNewPriority} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add New Label</Text>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <Button title="Save Settings" onPress={handleSaveSettings} />
              <Button title="Close" onPress={onClose} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: '90%',
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
    },
    header: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    subHeader: {
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 10,
      marginBottom: 5,
    },
    intervalButton: {
      backgroundColor: '#f0f0f0',
      padding: 10,
      alignItems: 'center',
      borderRadius: 8,
      marginBottom: 10,
    },
    intervalButtonText: {
      fontSize: 16,
      color: 'black',
    },
    intervalPalette: {
      flexDirection: 'row',
      marginBottom: 20,
      justifyContent: 'space-between',
    },
    intervalOption: {
      padding: 10,
      backgroundColor: '#e0e0e0',
      borderRadius: 8,
    },
    timeZonePalette: {
      flexDirection: 'column',
      marginBottom: 20,
    },
    timeZoneOption: {
      padding: 10,
      backgroundColor: '#e0e0e0',
      borderRadius: 8,
      marginVertical: 2,
    },
    intervalText: {
      fontSize: 16,
      color: 'black',
    },
    dayTimeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dayTimeBlock: {
      flex: 1,
      marginHorizontal: 5, // Adds spacing between the two dropdowns
    },
    priorityBlock: {
      marginBottom: 20,
    },
    priorityRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    priorityButton: {
      width: 80,
      height: 40,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    priorityButtonText: {
      color: 'black',
      fontWeight: 'bold',
    },
    priorityInput: {
      flex: 1,
      borderBottomWidth: 1,
      padding: 5,
      marginRight: 10,
    },
    deleteButton: {
      fontSize: 20,
      color: 'red',
    },
    addButton: {
      marginTop: 20,
      alignItems: 'center',
    },
    addButtonText: {
      color: '#1E8AFF',
      fontSize: 18,
    },
    buttonRow: {
      marginTop: 20,
    },
    colorPalette: {
      flexDirection: 'row',
      marginTop: 10,
      justifyContent: 'center',
    },
    colorOption: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginHorizontal: 5,
    },
  });

export default SettingsModal;