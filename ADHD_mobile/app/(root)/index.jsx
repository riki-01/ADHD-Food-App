import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from '@/assets/styles/home.styles';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { SignOutButton } from '@/components/SignOutButton';

export default function HomeScreen() {
  const { user } = useUser();
  const userName = user?.firstName || 'there';
  
  // Get current date in a readable format
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  // Sample meal data - replace with real data later
  const todaysMeals = [
    { id: '1', time: '8:00 AM', name: 'Oatmeal with berries' },
    { id: '2', time: '12:30 PM', name: 'Grilled chicken salad' },
    { id: '3', time: '3:00 PM', name: 'Greek yogurt with nuts' },
    { id: '4', time: '7:00 PM', name: 'Salmon with vegetables' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {userName} 👋</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <SignOutButton />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Meals</Text>
        {todaysMeals.length > 0 ? (
          todaysMeals.map((meal) => (
            <View key={meal.id} style={styles.mealItem}>
              <Text style={styles.mealTime}>{meal.time}</Text>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="fast-food-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyStateText}>
              No meals planned for today. Tap the + button to add some!
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.mealItem}>
          <Ionicons name="restaurant-outline" size={20} color={COLORS.primary} />
          <Text style={[styles.mealName, { marginLeft: 8 }]}>Log a Meal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mealItem}>
          <Ionicons name="barcode-outline" size={20} color={COLORS.primary} />
          <Text style={[styles.mealName, { marginLeft: 8 }]}>Scan Barcode</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
