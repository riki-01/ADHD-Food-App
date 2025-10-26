import { useThemeColor } from '@/hooks/use-theme-color';
import { dataService } from '@/services/dataService';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';


export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentChats, setRecentChats] = useState<ChatMessage[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');



  useEffect(() => {
    loadRecentChats();
    loadUserProfile();
  }, []);

  // Refresh recent chats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRecentChats();
    }, [])
  );

  const handleButtonPress = (buttonType: string) => {
    if (buttonType === 'Suggest Recipe') {
      router.push('/chat');
    } else if (buttonType === 'Inventory') {
      router.push('/(tabs)/explore');
    } else {
      console.log(`${buttonType} button pressed`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: '#4CAF50' }]}>MindMeal</Text>
            {userProfile?.name && (
              <Text style={[styles.welcomeText, { color: textColor }]}>
                Welcome back, {userProfile.name}!
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={textColor} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>5</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => handleButtonPress('Suggest Recipe')}
          >
            <Ionicons name="restaurant-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Suggest Recipe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
            onPress={() => handleButtonPress('Scan')}
          >
            <Ionicons name="scan-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => handleButtonPress('Inventory')}
          >
            <Ionicons name="cube-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Inventory</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { borderColor: '#E0E0E0' }]}>
            <Ionicons name="search-outline" size={20} color="#999" />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search previous chats"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Recent Conversations */}
        <View style={styles.conversationsContainer}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Recent Conversations
          </Text>

          {recentChats.length === 0 ? (
            <View style={styles.emptyConversations}>
              <Ionicons name="chatbubbles-outline" size={48} color="#E0E0E0" />
              <Text style={[styles.emptyText, { color: '#999' }]}>
                No conversations yet
              </Text>
              <Text style={[styles.emptySubtext, { color: '#999' }]}>
                Start a chat by tapping "Suggest Recipe" above
              </Text>
            </View>
          ) : (
            recentChats.map((chat) => (
              <TouchableOpacity 
                key={chat.id} 
                style={styles.chatItem}
                onPress={() => router.push(`/chat?chatId=${chat.id}`)}
              >
                <View style={styles.chatContent}>
                  <Text style={[styles.chatTitle, { color: textColor }]}>
                    {chat.title}
                  </Text>
                  <Text style={[styles.chatPreview, { color: '#666' }]}>
                  {chat.preview?.slice(0, 80)}{chat.preview?.length > 100 ? '...' : ''}
                  </Text>
                </View>
                <Text style={[styles.chatTimestamp, { color: '#999' }]}>
                  {chat.timestamp}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 16,
    marginTop: 4,
    opacity: 0.8,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5722',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  conversationsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  chatContent: {
    flex: 1,
    marginRight: 12,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatTimestamp: {
    fontSize: 12,
    alignSelf: 'flex-start',
  },
  emptyConversations: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
});
