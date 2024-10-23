// SettingsModal.js

import React, { useState } from 'react';
import { View, Text, Modal, Button, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

const SettingsModal = ({
  visible,
  onClose,
  timeInterval,
  setTimeInterval,
  customPriorities,
  setCustomPriorities,
  updateTimeBlocks,
}) => {
  const [colorPaletteVisible, setColorPaletteVisible] = useState(null); // Track the visible color palette

  const handleSaveSettings = () => {
    updateTimeBlocks(timeInterval);
    onClose();
  };

  // Function to add a new priority item
  const addNewPriority = () => {
    const newKey = `p${Object.keys(customPriorities).length + 1}`;
    setCustomPriorities((prev) => ({
      ...prev,
      [newKey]: { label: newKey, color: '#D3D3D3' }, // Default to yellow
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
    const colors = ['#D6B4FC', '#FF8184', '#FDAA48', '#FFFFC5', '#D1FFBD', '90D5FF', 'D3D3D3'];

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

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.header}>Priority Labels</Text>

          {/* Render priority buttons */}
          {Object.keys(customPriorities).map(renderPriorityButton)}

          {/* Button to add new priority */}
          <TouchableOpacity onPress={addNewPriority} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add New Label</Text>
          </TouchableOpacity>

          {/* Save and Close Buttons */}
          <View style={styles.buttonRow}>
            <Button title="Save Settings" onPress={handleSaveSettings} />
            <Button title="Close" onPress={onClose} />
          </View>
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
  priorityBlock: {
    marginBottom: 20, // Add some space between priority blocks
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityButton: {
    width: 40,
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
    padding: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'green',
    fontWeight: 'bold',
  },
  buttonRow: {
    marginTop: 20,
  },
  colorPalette: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'center', // Center the color options horizontally
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
  },
});

export default SettingsModal;