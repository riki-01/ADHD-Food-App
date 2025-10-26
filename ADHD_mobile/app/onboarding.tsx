import { useThemeColor } from '@/hooks/use-theme-color';
import { dataService } from '@/services/dataService';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';


export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    age: '',
    medicalConditions: [],
    dietaryGoals: [],
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [conditions, goals] = await Promise.all([
          dataService.getMedicalConditions(),
          dataService.getDietaryGoals()
        ]);
        setMedicalConditions(conditions);
        setDietaryGoals(goals);
      } catch (error) {
        console.error('Error loading onboarding options:', error);
      }
    };

    loadOptions();
  }, []);



  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleMedicalCondition = (condition: string) => {
    setData(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions.includes(condition)
        ? prev.medicalConditions.filter(c => c !== condition)
        : [...prev.medicalConditions, condition],
    }));
  };

  const toggleDietaryGoal = (goal: string) => {
    setData(prev => ({
      ...prev,
      dietaryGoals: prev.dietaryGoals.includes(goal)
        ? prev.dietaryGoals.filter(g => g !== goal)
        : [...prev.dietaryGoals, goal],
    }));
  };

  const renderProgressDots = () => {
    return (
      <View style={styles.progressContainer}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor: index <= currentStep ? '#4CAF50' : '#E0E0E0',
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.question, { color: textColor }]}>
              What's your name?
            </Text>
            <TextInput
              style={[styles.nameInput, { color: textColor, borderColor: '#E0E0E0' }]}
              value={data.name}
              onChangeText={(text) => setData(prev => ({ ...prev, name: text }))}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              textAlign="center"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.question, { color: textColor }]}>
              What's your age?
            </Text>
            <TextInput
              style={[styles.ageInput, { color: textColor, borderColor: '#E0E0E0' }]}
              value={data.age}
              onChangeText={(text) => setData(prev => ({ ...prev, age: text }))}
              keyboardType="numeric"
              placeholder="25"
              placeholderTextColor="#999"
              textAlign="center"
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.question, { color: textColor }]}>
              Do you have any medical conditions?
            </Text>
            <View style={styles.optionsContainer}>
              {medicalConditions.map((condition) => (
                <TouchableOpacity
                  key={condition}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: data.medicalConditions.includes(condition)
                        ? '#4CAF50'
                        : '#F5F5F5',
                    },
                  ]}
                  onPress={() => toggleMedicalCondition(condition)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: data.medicalConditions.includes(condition)
                          ? 'white'
                          : textColor,
                      },
                    ]}
                  >
                    {condition}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.question, { color: textColor }]}>
              What are your dietary goals?
            </Text>
            <View style={styles.optionsContainer}>
              {dietaryGoals.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: data.dietaryGoals.includes(goal)
                        ? '#4CAF50'
                        : '#F5F5F5',
                    },
                  ]}
                  onPress={() => toggleDietaryGoal(goal)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: data.dietaryGoals.includes(goal) ? 'white' : textColor,
                      },
                    ]}
                  >
                    {goal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: '#4CAF50' }]}>
            {steps[currentStep].title}
          </Text>
          <Text style={[styles.subtitle, { color: textColor }]}>
            {steps[currentStep].subtitle}
          </Text>
        </View>

        {renderProgressDots()}
        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.backButton, { opacity: currentStep === 0 ? 0.5 : 1 }]}
          onPress={handleBack}
          disabled={currentStep === 0}
        >
          <Text style={[styles.backButtonText, { color: textColor }]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: '#4CAF50' }]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: '600',
    borderBottomWidth: 2,
    paddingVertical: 15,
    paddingHorizontal: 20,
    minWidth: 200,
    textAlign: 'center',
  },
  ageInput: {
    fontSize: 48,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 100,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
