// AddTodoModal.js

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const AddTodoModal = ({ visible, onClose, onAddTodo, initialTitle, initialDescription, initialPriority, customPriorities = {}}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('none');

  // Populate fields when modal opens with initial values
  useEffect(() => {
    if (visible) {
      setTitle(initialTitle || '');
      setDescription(initialDescription || '');
      setPriority(initialPriority || 'none');
    }
  }, [visible, initialTitle, initialDescription, initialPriority]);

  const handleAddTodo = () => {
    const newTask = {
      title,
      description,
      priority,
    };
    onAddTodo(newTask);
    setTitle('');
    setDescription('');
    setPriority('none'); // Reset to default
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.header}>Add Task for This Time Block</Text>
          <TextInput
            placeholder="Title"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            placeholder="Description (Optional)"
            style={styles.input}
            value={description}
            onChangeText={setDescription}
          />

          {/* Priority Selection */}
          <View style={styles.priorityContainer}>
            <Text style={styles.priorityHeader}>Priority:</Text>

            {Object.keys(customPriorities).map((priorityKey) => {
              const priorityItem = customPriorities[priorityKey];
              return (
                <TouchableOpacity key={priorityKey} onPress={() => setPriority(priorityKey)}>
                  <Text
                    style={[
                      styles.priorityButton,
                      priority === priorityKey && styles.prioritySelected,
                      { backgroundColor: priorityItem.color },
                    ]}
                  >
                    {priorityItem.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity onPress={() => setPriority('none')}>
              <Text
                style={[
                  styles.priorityButton,
                  priority === 'none' && styles.prioritySelected,
                  { backgroundColor: '#FFF' },
                ]}
              >
                None
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add Task Button */}
          <Button title="Add Task" onPress={handleAddTodo} />

          {/* Close Modal */}
          <Button title="Close" onPress={onClose} />
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
    input: {
      borderBottomWidth: 1,
      marginBottom: 20,
      padding: 10,
    },
    priorityContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
      flexWrap: 'wrap',
    },
    priorityHeader: {
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: 10,
    },
    priorityButton: {
      fontSize: 16,
      padding: 10,
      borderRadius: 5,
      borderWidth: 1,
      color: 'black',
      textAlign: 'center',
      margin: 5,
    },
    prioritySelected: {
      borderColor: '#333',
      borderWidth: 2,
    },
  });
  
  export default AddTodoModal;