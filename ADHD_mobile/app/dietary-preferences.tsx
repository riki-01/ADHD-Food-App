import { useThemeColor } from '@/hooks/use-theme-color';
import { dataService } from '@/services/dataService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function DietaryPreferencesScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Available Options
  const [availableGoals, setAvailableGoals] = useState<string[]>([]);
  const [availableConditions, setAvailableConditions] = useState<string[]>([]);

  // User Selection
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  
  // New Allergy Input
  const [newAllergy, setNewAllergy] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [goals, conditions, userPrefs] = await Promise.all([
        dataService.getDietaryGoals(),
        dataService.getMedicalConditions(),
        dataService.getUserPreferences()
      ]);

      setAvailableGoals(goals || []);
      setAvailableConditions(conditions || []);

      if (userPrefs) {
        setSelectedGoals(userPrefs.dietaryGoals || []);
        setSelectedConditions(userPrefs.medicalConditions || []);
        setAllergies(userPrefs.allergies || []);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await dataService.updateUserPreferences({
        dietaryGoals: selectedGoals,
        medicalConditions: selectedConditions,
        allergies: allergies
      });
      
      if (result.success) {
        Alert.alert('Success', 'Preferences updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Selection Helpers
  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev => 
      prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]
    );
  };

  // Allergy Helpers
  const addAllergy = () => {
    if (newAllergy.trim()) {
      if (!allergies.includes(newAllergy.trim())) {
        setAllergies([...allergies, newAllergy.trim()]);
      }
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter(a => a !== allergy));
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Dietary Preferences</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Dietary Goals Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Dietary Goals</Text>
          <Text style={styles.sectionSubtitle}>Select the goals you want to achieve.</Text>
          <View style={styles.chipsContainer}>
            {availableGoals.map(goal => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.chip,
                  selectedGoals.includes(goal) ? styles.chipSelected : styles.chipUnselected
                ]}
                onPress={() => toggleGoal(goal)}
              >
                <Text style={[
                  styles.chipText,
                  selectedGoals.includes(goal) ? styles.chipTextSelected : { color: textColor }
                ]}>
                  {goal.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Medical Conditions Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Medical Conditions</Text>
          <Text style={styles.sectionSubtitle}>Select any conditions we should consider.</Text>
          <View style={styles.chipsContainer}>
            {availableConditions.map(condition => (
              <TouchableOpacity
                key={condition}
                style={[
                  styles.chip,
                  selectedConditions.includes(condition) ? styles.chipSelected : styles.chipUnselected
                ]}
                onPress={() => toggleCondition(condition)}
              >
                <Text style={[
                  styles.chipText,
                  selectedConditions.includes(condition) ? styles.chipTextSelected : { color: textColor }
                ]}>
                  {condition}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Allergies Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Allergies & Restrictions</Text>
          <Text style={styles.sectionSubtitle}>Add items you are allergic to.</Text>
          
          <View style={styles.addInputContainer}>
            <TextInput
              style={[styles.input, { color: textColor, borderColor: '#E0E0E0', backgroundColor: '#F5F5F5' }]}
              value={newAllergy}
              onChangeText={setNewAllergy}
              placeholder="Type an allergy (e.g. Peanuts)"
              placeholderTextColor="#999"
              onSubmitEditing={addAllergy}
            />
            <TouchableOpacity style={styles.addButton} onPress={addAllergy}>
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.chipsContainer}>
            {allergies.map(allergy => (
              <View key={allergy} style={styles.allergyChip}>
                <Text style={styles.allergyText}>{allergy}</Text>
                <TouchableOpacity onPress={() => removeAllergy(allergy)}>
                  <Ionicons name="close-circle" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, { opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
  },
  chipUnselected: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  chipSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  // Allergies specific styles
  addInputContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF7043',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  allergyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});