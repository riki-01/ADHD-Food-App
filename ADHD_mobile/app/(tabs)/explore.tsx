import { useThemeColor } from '@/hooks/use-theme-color';
import { dataService } from '@/services/dataService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
// Conditional import for DateTimePicker
let DateTimePicker: any;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
  // Fallback if package is not installed
  DateTimePicker = null;
}

interface InventoryItem {
  id: string;
  name: string;
  amount: string;
  boughtDate: string; // Keep as string for display, but we'll handle Date conversion
  expiryDate?: string;
  notes?: string;
  category?: string;
}

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    boughtDate: '',
    expiryDate: '',
    notes: '',
  });
  const [selectedBoughtDate, setSelectedBoughtDate] = useState(new Date());
  const [selectedExpiryDate, setSelectedExpiryDate] = useState(new Date());
  const [showBoughtDatePicker, setShowBoughtDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const inventory = await dataService.getUserInventory();
        setItems(inventory);
      } catch (error) {
        console.error('Error loading inventory:', error);
      }
    };

    loadInventory();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    const today = new Date();
    const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    setSelectedBoughtDate(today);
    setSelectedExpiryDate(futureDate);
    setFormData({ 
      name: '', 
      amount: '', 
      boughtDate: today.toISOString().split('T')[0], 
      expiryDate: futureDate.toISOString().split('T')[0],
      notes: '' 
    });
    setModalVisible(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    const boughtDate = new Date(item.boughtDate);
    const expiryDate = item.expiryDate ? new Date(item.expiryDate) : new Date();
    setSelectedBoughtDate(boughtDate);
    setSelectedExpiryDate(expiryDate);
    setFormData({
      name: item.name,
      amount: item.amount,
      boughtDate: item.boughtDate,
      expiryDate: item.expiryDate || '',
      notes: item.notes || '',
    });
    setModalVisible(true);
  };

  const onBoughtDateChange = (event: any, date?: Date) => {
    setShowBoughtDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedBoughtDate(date);
      const dateString = date.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, boughtDate: dateString }));
    }
  };

  const onExpiryDateChange = (event: any, date?: Date) => {
    setShowExpiryDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedExpiryDate(date);
      const dateString = date.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, expiryDate: dateString }));
    }
  };

  const showBoughtDatePickerModal = () => {
    if (DateTimePicker) {
      setShowBoughtDatePicker(true);
    } else {
      // Fallback: Use prompt for date input
      Alert.prompt(
        'Enter Bought Date',
        'Please enter date in YYYY-MM-DD format:',
        (text) => {
          if (text && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
            setFormData(prev => ({ ...prev, boughtDate: text }));
          }
        },
        'plain-text',
        formData.boughtDate
      );
    }
  };

  const showExpiryDatePickerModal = () => {
    if (DateTimePicker) {
      setShowExpiryDatePicker(true);
    } else {
      // Fallback: Use prompt for date input
      Alert.prompt(
        'Enter Expiry Date',
        'Please enter date in YYYY-MM-DD format:',
        (text) => {
          if (text && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
            setFormData(prev => ({ ...prev, expiryDate: text }));
          }
        },
        'plain-text',
        formData.expiryDate
      );
    }
  };

  const saveItem = async () => {
    if (!formData.name.trim() || !formData.amount.trim()) {
      Alert.alert('Error', 'Please fill in the required fields');
      return;
    }

    try {
      if (editingItem) {
        // Edit existing item
        const result = await dataService.updateInventoryItem(editingItem.id, formData);
        if (result.success) {
          setItems(prev =>
            prev.map(item =>
              item.id === editingItem.id
                ? { ...item, ...formData }
                : item
            )
          );
        }
      } else {
        // Add new item
        const result = await dataService.addInventoryItem(formData);
        if (result.success) {
          const newItem: InventoryItem = {
            id: result.id,
            ...formData,
          };
          setItems(prev => [...prev, newItem]);
        }
      }

      setModalVisible(false);
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    }
  };

  const deleteItem = (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await dataService.deleteInventoryItem(id);
              if (result.success) {
                setItems(prev => prev.filter(item => item.id !== id));
              }
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderInventoryItem = (item: InventoryItem) => {
    return (
      <View key={item.id} style={styles.itemContainer}>
        <View style={styles.itemContent}>
          <Text style={[styles.itemName, { color: textColor }]}>{item.name}</Text>
          <Text style={[styles.itemDetails, { color: '#666' }]}>
            {item.amount}
          </Text>
          <Text style={[styles.itemDetails, { color: '#666' }]}>
            Bought: {item.boughtDate}
          </Text>
          {item.expiryDate && (
            <Text style={[styles.itemDetails, { color: '#666' }]}>
              Expires: {item.expiryDate}
            </Text>
          )}
          {item.notes && (
            <Text style={[styles.itemNotes, { color: '#666' }]}>{item.notes}</Text>
          )}
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create-outline" size={16} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F44336' }]}
            onPress={() => deleteItem(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Inventory</Text>
      </View>

      {/* Items List */}
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {items.map(renderInventoryItem)}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: textColor }]}>Name</Text>
                <TextInput
                  style={[styles.formInput, { color: textColor, borderColor: '#E0E0E0' }]}
                  placeholder="Enter item name"
                  placeholderTextColor="#999"
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: textColor }]}>Amount</Text>
                <TextInput
                  style={[styles.formInput, { color: textColor, borderColor: '#E0E0E0' }]}
                  placeholder="e.g., 500g, 2 pieces"
                  placeholderTextColor="#999"
                  value={formData.amount}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: textColor }]}>Bought Date</Text>
                <TouchableOpacity
                  style={[styles.datePickerButton, { borderColor: '#E0E0E0' }]}
                  onPress={showBoughtDatePickerModal}
                >
                  <Text style={[styles.datePickerText, { color: textColor }]}>
                    {formData.boughtDate || 'Select Date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </TouchableOpacity>
                {showBoughtDatePicker && DateTimePicker && (
                  <DateTimePicker
                    value={selectedBoughtDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onBoughtDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: textColor }]}>Expiry Date (Optional)</Text>
                <TouchableOpacity
                  style={[styles.datePickerButton, { borderColor: '#E0E0E0' }]}
                  onPress={showExpiryDatePickerModal}
                >
                  <Text style={[styles.datePickerText, { color: textColor }]}>
                    {formData.expiryDate || 'Select Expiry Date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </TouchableOpacity>
                {showExpiryDatePicker && DateTimePicker && (
                  <DateTimePicker
                    value={selectedExpiryDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onExpiryDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: textColor }]}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.formInput, { color: textColor, borderColor: '#E0E0E0' }]}
                  placeholder="Additional notes"
                  placeholderTextColor="#999"
                  value={formData.notes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveItem}>
                <Text style={styles.saveButtonText}>
                  {editingItem ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  itemNotes: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalForm: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  datePickerText: {
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
