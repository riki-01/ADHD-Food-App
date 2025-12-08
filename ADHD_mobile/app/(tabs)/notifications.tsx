import { useThemeColor } from '@/hooks/use-theme-color';
import { dataService } from '@/services/dataService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'inventory' | 'recipe' | 'custom';
  isRead: boolean;
}

export default function NotificationsScreen() {
  const [activeTab, setActiveTab] = useState<'All' | 'Inventory' | 'Recipe' | 'Custom'>('All');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const tabs = ['All', 'Inventory', 'Recipe', 'Custom'] as const;

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const userNotifications = await dataService.getUserNotifications();
        setNotifications(userNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'All') return true;
    return notification.type === activeTab.toLowerCase();
  });

  const markAsRead = async (id: string) => {
    try {
      const result = await dataService.markNotificationAsRead(id);
      if (result.success) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === id
              ? { ...notification, isRead: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inventory':
        return 'cube-outline';
      case 'recipe':
        return 'restaurant-outline';
      case 'custom':
        return 'notifications-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const renderNotification = (notification: Notification) => {
    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          !notification.isRead && styles.unreadNotification,
        ]}
        onPress={() => markAsRead(notification.id)}
      >
        <View style={styles.notificationIcon}>
          <Ionicons
            name={getNotificationIcon(notification.type)}
            size={24}
            color="#4CAF50"
          />
          {!notification.isRead && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, { color: textColor }]}>
            {notification.title}
          </Text>
          <Text style={[styles.notificationMessage, { color: '#666' }]}>
            {notification.message}
          </Text>
        </View>
        <Text style={[styles.notificationTime, { color: '#999' }]}>
          {notification.timestamp}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Notifications</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { backgroundColor: '#4CAF50' },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === tab ? 'white' : textColor,
                  },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(renderNotification)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#E0E0E0" />
            <Text style={[styles.emptyStateText, { color: '#999' }]}>
              No notifications in this category
            </Text>
          </View>
        )}
      </ScrollView>
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
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  unreadNotification: {
    backgroundColor: '#F8FFF8',
  },
  notificationIcon: {
    position: 'relative',
    marginRight: 16,
    marginTop: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});
