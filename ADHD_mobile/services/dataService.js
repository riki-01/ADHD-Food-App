import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  get,
  push,
  ref,
  set,
  update
} from 'firebase/database';
import data from './dump.js'; // Fallback data for initialization
import { auth, database } from './firebaseConfig.js';

/**
 * Data service that provides access to Firebase Realtime Database
 * This service abstracts the Firebase structure and provides
 * simple methods to access user data with authentication
 */
class DataService {
  constructor() {
    this.currentUser = null;
    this.currentUserId = null;
    this.listeners = [];
    
    // Initialize Firebase auth state listener
    this.initializeAuth();
    
    // Initialize application options in Firebase if they don't exist
    this.initializeApplicationOptions();
  }

  // Initialize Firebase authentication state listener
  initializeAuth() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = user;
        this.currentUserId = user.uid;
      } else {
        this.currentUser = null;
        this.currentUserId = null;
      }
    });
  }

  // Initialize application options in Firebase if they don't exist
  async initializeApplicationOptions() {
    try {
      const optionsRef = ref(database, 'application-options');
      const snapshot = await get(optionsRef);
      
      if (!snapshot.exists()) {
        // Create application options from dump.js fallback data
        await set(optionsRef, data['application-options']);
      }
    } catch (error) {
      console.error('Error initializing application options:', error);
    }
  }

  // Get current user's data from Firebase
  async getCurrentUser() {
    if (!this.currentUserId) return null;
    
    try {
      const userRef = ref(database, `users/${this.currentUserId}`);
      const snapshot = await get(userRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Authentication methods using Firebase Auth
  async authenticateUser(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;
      this.currentUserId = userCredential.user.uid;
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, message: error.message };
    }
  }

  // Method to register a new user with Firebase Auth
  async registerUser(email, password, additionalData = {}) {
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      this.currentUser = user;
      this.currentUserId = user.uid;

      // Create user profile in Firebase Realtime Database
      const now = Math.floor(Date.now() / 1000);
      const newUserData = {
        profile: {
          name: additionalData.name || 'New User',
          email: email,
          age: additionalData.age || 25,
          createdAt: now,
          updatedAt: now,
          bloodGroup: additionalData.bloodGroup || 'O+',
          isAdmin: false
        },
        preferences: {
          medicalConditions: additionalData.medicalConditions || [],
          dietaryGoals: additionalData.dietaryGoals || [],
          allergies: additionalData.allergies || []
        },
        inventory: {},
        chat: {},
        notifications: []
      };

      // Save user data to Firebase Realtime Database
      const userRef = ref(database, `users/${user.uid}`);
      await set(userRef, newUserData);

      return { success: true, userId: user.uid, user: user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: error.message };
    }
  }

  // Method to logout user
  async logout() {
    try {
      await signOut(auth);
      this.currentUser = null;
      this.currentUserId = null;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: error.message };
    }
  }

  // Method to check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null && this.currentUserId !== null;
  }

  // Profile methods
  async getUserProfile() {
    const user = await this.getCurrentUser();
    return user ? user.profile : null;
  }

  async getUserPreferences() {
    const user = await this.getCurrentUser();
    return user ? user.preferences : null;
  }

  // Update user profile
  async updateUserProfile(profileData) {
    if (!this.currentUserId) return { success: false, message: 'User not authenticated' };
    
    try {
      const updates = {};
      Object.keys(profileData).forEach(key => {
        updates[`users/${this.currentUserId}/profile/${key}`] = profileData[key];
      });
      updates[`users/${this.currentUserId}/profile/updatedAt`] = Math.floor(Date.now() / 1000);
      
      await update(ref(database), updates);
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, message: error.message };
    }
  }

  // Update user preferences
  async updateUserPreferences(preferences) {
    if (!this.currentUserId) return { success: false, message: 'User not authenticated' };
    
    try {
      const preferencesRef = ref(database, `users/${this.currentUserId}/preferences`);
      await set(preferencesRef, preferences);
      return { success: true };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { success: false, message: error.message };
    }
  }

  // Inventory methods
  async getUserInventory() {
    if (!this.currentUserId) return [];
    
    try {
      const inventoryRef = ref(database, `users/${this.currentUserId}/inventory`);
      const snapshot = await get(inventoryRef);
      
      if (!snapshot.exists()) return [];
      
      const inventory = snapshot.val();
      
      // Convert object structure to array for easier use in components
      return Object.entries(inventory)
        .filter(([id, item]) => !item.isDeleted)
        .map(([id, item]) => ({
          id,
          name: item.name,
          amount: item.quantity, // Map quantity to amount for compatibility
          boughtDate: new Date(item.boughtDate * 1000).toISOString().split('T')[0], // Convert timestamp to date string
          notes: item.notes || '',
          expiryDate: item.expiryDate ? new Date(item.expiryDate * 1000).toISOString().split('T')[0] : null
        }));
    } catch (error) {
      console.error('Error getting inventory:', error);
      return [];
    }
  }

  async addInventoryItem(itemData) {
    if (!this.currentUserId) return { success: false, message: 'User not authenticated' };

    try {
      const now = Math.floor(Date.now() / 1000);
      
      const newItem = {
        name: itemData.name,
        quantity: itemData.amount, // Map amount back to quantity
        boughtDate: new Date(itemData.boughtDate).getTime() / 1000,
        createdAt: now,
        updatedAt: now,
        notes: itemData.notes || '',
        isDeleted: false
      };

      if (itemData.expiryDate) {
        newItem.expiryDate = new Date(itemData.expiryDate).getTime() / 1000;
      }

      // Push new item to Firebase (this generates a unique key)
      const inventoryRef = ref(database, `users/${this.currentUserId}/inventory`);
      const newItemRef = push(inventoryRef);
      await set(newItemRef, newItem);
      
      return { success: true, id: newItemRef.key };
    } catch (error) {
      console.error('Error adding inventory item:', error);
      return { success: false, message: error.message };
    }
  }

  async updateInventoryItem(id, itemData) {
    if (!this.currentUserId) return { success: false, message: 'User not authenticated' };

    try {
      const updates = {
        name: itemData.name,
        quantity: itemData.amount,
        boughtDate: new Date(itemData.boughtDate).getTime() / 1000,
        notes: itemData.notes || '',
        updatedAt: Math.floor(Date.now() / 1000)
      };

      if (itemData.expiryDate) {
        updates.expiryDate = new Date(itemData.expiryDate).getTime() / 1000;
      }

      const itemRef = ref(database, `users/${this.currentUserId}/inventory/${id}`);
      await update(itemRef, updates);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating inventory item:', error);
      return { success: false, message: error.message };
    }
  }

  async deleteInventoryItem(id) {
    if (!this.currentUserId) return { success: false, message: 'User not authenticated' };

    try {
      const updates = {
        isDeleted: true,
        updatedAt: Math.floor(Date.now() / 1000)
      };

      const itemRef = ref(database, `users/${this.currentUserId}/inventory/${id}`);
      await update(itemRef, updates);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return { success: false, message: error.message };
    }
  }

  // Chat methods
  async getUserChats() {
    if (!this.currentUserId) return [];
    
    try {
      const chatRef = ref(database, `users/${this.currentUserId}/chat`);
      const snapshot = await get(chatRef);
      
      if (!snapshot.exists()) return [];
      
      const chats = snapshot.val();
      
      // Convert object structure to array
      return Object.entries(chats).map(([id, chat]) => ({
        id,
        title: chat.title,
        lastUpdated: chat.lastUpdated,
        createdAt: chat.createdAt,
        messages: chat.messages ? Object.entries(chat.messages).map(([msgId, message]) => ({
          id: msgId,
          text: message.content,
          isUser: message.sender === "user",
          sender: message.sender,
          timestamp: new Date(message.createdAt * 1000).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          createdAt: message.createdAt
        })).sort((a, b) => a.createdAt - b.createdAt) : []
      }));
    } catch (error) {
      console.error('Error getting user chats:', error);
      return [];
    }
  }

  async getChatMessages(chatId) {
    if (!this.currentUserId) return [];
    
    try {
      const messagesRef = ref(database, `users/${this.currentUserId}/chat/${chatId}/messages`);
      const snapshot = await get(messagesRef);
      
      if (!snapshot.exists()) return [];
      
      const messages = snapshot.val();
      
      // Convert messages object to array and sort by creation time
      return Object.entries(messages)
        .map(([id, message]) => ({
          id,
          text: message.content,
          isUser: message.sender === "user",
          sender: message.sender,
          timestamp: new Date(message.createdAt * 1000).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          createdAt: message.createdAt
        }))
        .sort((a, b) => a.createdAt - b.createdAt);
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  // Add new chat
  async addChat(title) {
    if (!this.currentUserId) return { success: false, message: 'User not authenticated' };

    try {
      const now = Math.floor(Date.now() / 1000);
      const newChat = {
        title,
        createdAt: now,
        lastUpdated: now,
        messages: {}
      };

      const chatRef = ref(database, `users/${this.currentUserId}/chat`);
      const newChatRef = push(chatRef);
      await set(newChatRef, newChat);
      
      return { success: true, chatId: newChatRef.key };
    } catch (error) {
      console.error('Error adding chat:', error);
      return { success: false, message: error.message };
    }
  }

  // Add message to chat
  async addMessageToChat(chatId, content, sender = "user") {
    if (!this.currentUserId) return { success: false, message: 'User not authenticated' };

    try {
      const now = Math.floor(Date.now() / 1000);
      const newMessage = {
        content,
        createdAt: now,
        sender
      };

      const messageRef = ref(database, `users/${this.currentUserId}/chat/${chatId}/messages`);
      const newMessageRef = push(messageRef);
      await set(newMessageRef, newMessage);

      // Update chat's lastUpdated
      const chatUpdateRef = ref(database, `users/${this.currentUserId}/chat/${chatId}/lastUpdated`);
      await set(chatUpdateRef, now);
      
      return { success: true, messageId: newMessageRef.key };
    } catch (error) {
      console.error('Error adding message to chat:', error);
      return { success: false, message: error.message };
    }
  }

  // Create new conversation with first message
  async createConversation(userMessage, title) {
    if (!this.currentUserId) return { success: false, message: 'User not authenticated' };

    try {
      const now = Math.floor(Date.now() / 1000);
      
      // Create new conversation
      const newConversation = {
        title,
        createdAt: now,
        lastUpdated: now,
        messages: {}
      };

      const chatRef = ref(database, `users/${this.currentUserId}/chat`);
      const newChatRef = push(chatRef);
      await set(newChatRef, newConversation);

      // Add the first user message
      const firstMessage = {
        content: userMessage,
        createdAt: now,
        sender: "user"
      };

      const messageRef = ref(database, `users/${this.currentUserId}/chat/${newChatRef.key}/messages`);
      const newMessageRef = push(messageRef);
      await set(newMessageRef, firstMessage);

      return { success: true, conversationId: newChatRef.key, messageId: newMessageRef.key };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { success: false, message: error.message };
    }
  }

  // Get conversation messages for AI context
  async getConversationMessagesForAI(chatId) {
    if (!this.currentUserId) return [];
    
    try {
      const messagesRef = ref(database, `users/${this.currentUserId}/chat/${chatId}/messages`);
      const snapshot = await get(messagesRef);
      
      if (!snapshot.exists()) return [];
      
      const messages = snapshot.val();
      
      // Convert to format suitable for AI (with sender and content)
      return Object.entries(messages)
        .map(([id, message]) => ({
          sender: message.sender,
          content: message.content,
          createdAt: message.createdAt
        }))
        .sort((a, b) => a.createdAt - b.createdAt);
    } catch (error) {
      console.error('Error getting conversation messages for AI:', error);
      return [];
    }
  }

  // Application options methods (from Firebase application-options)
  async getApplicationOptions() {
    try {
      const optionsRef = ref(database, 'application-options');
      const snapshot = await get(optionsRef);
      return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
      console.error('Error getting application options:', error);
      return {};
    }
  }

  async getDietaryGoals() {
    const options = await this.getApplicationOptions();
    return options.dietaryGoals || [];
  }

  async getMedicalConditions() {
    const options = await this.getApplicationOptions();
    return options.medicalConditions || [];
  }

  async getBloodGroups() {
    const options = await this.getApplicationOptions();
    return options.bloodGroups || [];
  }

  async getProfileOptions() {
    const options = await this.getApplicationOptions();
    return options.profileOptions || [];
  }

  // Utility methods
  generateId() {
    // Generate 6-character random string like in dump.js
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Get user notifications from Firebase
  async getUserNotifications() {
    if (!this.currentUserId) return [];
    
    try {
      const notificationsRef = ref(database, `users/${this.currentUserId}/notifications`);
      const snapshot = await get(notificationsRef);
      return snapshot.exists() ? snapshot.val() : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Get recent chats from user's chat data in Firebase
  async getRecentChats() {
    const userChats = await this.getUserChats();
    
    // Convert chat data to recent chat format for the home screen
    // Sort by lastUpdated timestamp (most recent first)
    return userChats
      .map(chat => {
        const lastMessage = chat.messages && chat.messages.length > 0 
          ? chat.messages[chat.messages.length - 1] 
          : null;
        
        return {
          id: chat.id,
          title: chat.title,
          preview: lastMessage 
            ? `${lastMessage.sender === 'user' ? 'You' : 'Assistant'}: ${lastMessage.text}` 
            : 'No messages yet',
          timestamp: new Date(chat.lastUpdated * 1000).toLocaleDateString(),
          lastUpdated: chat.lastUpdated
        };
      })
      .sort((a, b) => b.lastUpdated - a.lastUpdated);
  }

  // Get chat initialization data
  getChatInitData() {
    return {
      initialMessage: {
        id: '1',
        text: "Hello! I'm here to help you create delicious and healthy meals based on your inventory and dietary needs. What would you like to cook today?",
        isUser: false,
        timestamp: '10:30 AM',
      },
      sampleRecipe: {
        name: '🍗 **Honey Garlic Chicken & Broccoli**',
        prepTime: '• Prep time: 20 minutes',
        ingredients: ['Chicken breast', 'Broccoli florets', 'Honey', 'Garlic', 'Soy sauce', 'Olive oil'],
      },
    };
  }

  // Method to add notification to user
  async addNotification(notification) {
    if (!this.currentUserId) return { success: false, message: 'User not authenticated' };
    
    try {
      const newNotification = {
        id: this.generateId(),
        ...notification,
        timestamp: new Date().toLocaleString(),
        isRead: false
      };

      const notificationsRef = ref(database, `users/${this.currentUserId}/notifications`);
      const newNotificationRef = push(notificationsRef);
      await set(newNotificationRef, newNotification);
      
      return { success: true, notificationId: newNotificationRef.key };
    } catch (error) {
      console.error('Error adding notification:', error);
      return { success: false, message: error.message };
    }
  }

  // Method to mark notification as read
  async markNotificationAsRead(notificationId) {
    if (!this.currentUserId) return { success: false, message: 'User not authenticated' };
    
    try {
      const notificationRef = ref(database, `users/${this.currentUserId}/notifications/${notificationId}/isRead`);
      await set(notificationRef, true);
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, message: error.message };
    }
  }

  // Get user context for AI (excluding chat data)
  async getUserContextForAI() {
    if (!this.currentUserId) return null;
    
    try {
      const userRef = ref(database, `users/${this.currentUserId}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) return null;
      
      const userData = snapshot.val();
      
      // Return user data excluding chat block
      const { chat, ...userContextData } = userData;
      
      return userContextData;
    } catch (error) {
      console.error('Error getting user context for AI:', error);
      return null;
    }
  }

  // Method to cleanup listeners
  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
  }
}

// Export singleton instance
export const dataService = new DataService();
export default dataService;
