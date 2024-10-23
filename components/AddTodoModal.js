// components/AddTodoModal.js
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddTodoModal = ({ visible, onClose, onAddTodo }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priority, setPriority] = useState('Normal');

  // Handle date picker change
  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleAddTodo = () => {
    const newTodo = {
      title,
      description,
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      priority,
    };
    onAddTodo(newTodo);
    setTitle('');
    setDescription('');
    setPriority('Normal');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.header}>Add New Task</Text>
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

          {/* Date Picker */}
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {`Due Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          {/* Priority Selection */}
          <View style={styles.priorityContainer}>
            <Text style={styles.priorityHeader}>Priority:</Text>
            <TouchableOpacity onPress={() => setPriority('High')}>
              <Text style={[styles.priorityButton, priority === 'High' && styles.prioritySelected]}>High</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPriority('Normal')}>
              <Text style={[styles.priorityButton, priority === 'Normal' && styles.prioritySelected]}>Normal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPriority('Low')}>
              <Text style={[styles.priorityButton, priority === 'Low' && styles.prioritySelected]}>Low</Text>
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
  dateButton: {
    backgroundColor: '#eee',
    padding: 10,
    marginBottom: 20,
  },
  dateButtonText: {
    fontSize: 16,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  priorityHeader: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  priorityButton: {
    fontSize: 16,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  prioritySelected: {
    backgroundColor: '#ddd',
  },
});

export default AddTodoModal;