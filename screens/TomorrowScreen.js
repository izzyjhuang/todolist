import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button } from 'react-native';
import AddTodoModal from '../components/AddTodoModal';

const generateTimeBlocks = () => {
  const blocks = [];
  let hour = 0;
  let minute = 0;

  for (let i = 0; i < 96; i++) { // 96 blocks for 15-minute increments in 24 hours
    const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    blocks.push({ id: i.toString(), time: formattedTime, title: '', description: '', priority: 'Normal' });
    
    minute += 15;
    if (minute === 60) {
      minute = 0;
      hour += 1;
    }
  }
  return blocks;
};

const TomorrowScreen = () => {
  const [blocks, setBlocks] = useState(generateTimeBlocks());
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false); // Selection mode toggle
  const [entryBlock, setEntryBlock] = useState(null); // Block selected in entry mode

  // Toggle between Select and Entry modes
  const toggleSelectMode = () => {
    setIsSelecting(!isSelecting);
    setSelectedBlocks([]); // Clear any existing selection
  };

  // Entry mode - handle a block click and open modal to enter plan
  const handleBlockPressEntryMode = (block) => {
    setEntryBlock(block);
    setModalVisible(true);
  };

  // Select mode - select consecutive blocks
  const handleBlockPressSelectMode = (block) => {
    if (selectedBlocks.length === 0) {
      setSelectedBlocks([block]); // Start selection
    } else {
      const lastSelected = selectedBlocks[selectedBlocks.length - 1];
      const blockIndex = parseInt(block.id);
      const lastIndex = parseInt(lastSelected.id);

      // Ensure consecutive selection
      if (blockIndex > lastIndex) {
        const newSelection = blocks.slice(lastIndex, blockIndex + 1);
        setSelectedBlocks(newSelection);
      } else {
        const newSelection = blocks.slice(blockIndex, lastIndex + 1);
        setSelectedBlocks(newSelection);
      }
    }
  };

  const handleAddTodo = (newTask) => {
    const updatedBlocks = blocks.map((block) =>
      selectedBlocks.find(selected => selected.id === block.id) || (entryBlock && block.id === entryBlock.id)
        ? { ...block, ...newTask }
        : block
    );
    setBlocks(updatedBlocks);
    setSelectedBlocks([]); // Clear the selection after merging
    setEntryBlock(null); // Clear entry block
    setModalVisible(false);
  };

  const handleMerge = () => {
    setModalVisible(true);
  };

  const handleCancel = () => {
    setSelectedBlocks([]); // Clear the selection
  };

  const renderBlock = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.block,
        selectedBlocks.find(block => block.id === item.id) ? styles.selectedBlock : null
      ]}
      onPress={() =>
        isSelecting ? handleBlockPressSelectMode(item) : handleBlockPressEntryMode(item)
      }
    >
      <Text style={styles.timeText}>{item.time}</Text>
      {item.title ? (
        <View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.priority}>Priority: {item.priority}</Text>
        </View>
      ) : (
        <Text style={styles.emptyText}>Empty</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Tomorrow</Text>
        <Button title={isSelecting ? "Cancel Select" : "Select"} onPress={toggleSelectMode} />
      </View>

      <FlatList
        data={blocks}
        keyExtractor={(item) => item.id}
        renderItem={renderBlock}
      />

      {/* Show merge and cancel buttons when blocks are selected */}
      {isSelecting && selectedBlocks.length > 1 && (
        <View style={styles.selectionOptions}>
          <Button title="Merge" onPress={handleMerge} />
          <Button title="Cancel" onPress={handleCancel} />
        </View>
      )}

      <AddTodoModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedBlocks([]);
          setEntryBlock(null);
        }}
        onAddTodo={handleAddTodo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  block: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
    height: 60,
  },
  selectedBlock: {
    backgroundColor: '#d3f9d8',
  },
  timeText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  priority: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#aaa',
  },
  selectionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
});

export default TomorrowScreen;