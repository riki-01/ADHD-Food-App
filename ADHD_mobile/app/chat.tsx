import { useThemeColor } from '@/hooks/use-theme-color';
import { dataService } from '@/services/dataService';
import groqService from '@/services/groqService';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  sender: string;
  timestamp: string;
  createdAt: number;
}

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const chatId = params.chatId as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId || null);
  const scrollViewRef = useRef<ScrollView>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  // Load messages when component mounts or chatId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (currentChatId) {
        try {
          const chatMessages = await dataService.getChatMessages(currentChatId);
          setMessages(chatMessages);
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      }
    };

    loadMessages();
  }, [currentChatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      let conversationId = currentChatId;

      // If no current chat, create a new conversation
      if (!conversationId) {
        const title = groqService.generateConversationTitle(messageText);
        const result = await dataService.createConversation(messageText, title);
        
        if (result.success && result.conversationId) {
          conversationId = result.conversationId;
          setCurrentChatId(conversationId);
        } else {
          console.error('Failed to create conversation:', result.message);
          setIsLoading(false);
          return;
        }
      } else {
        // Add user message to existing conversation
        await dataService.addMessageToChat(conversationId, messageText, "user");
      }

      // Get conversation history for AI context
      const conversationHistory = await dataService.getConversationMessagesForAI(conversationId);
      
      // Get user context for AI (profile, preferences, inventory)
      const userContext = await dataService.getUserContextForAI();
      
      // Get AI response with user context
      const aiResponse = await groqService.getResponse(messageText, conversationHistory, userContext);
      
      // Add AI response to conversation
      await dataService.addMessageToChat(conversationId, aiResponse, "assistant");

      // Reload messages to show the new ones
      const updatedMessages = await dataService.getChatMessages(conversationId);
      setMessages(updatedMessages);

    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to UI
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Sorry, I'm having trouble processing your message right now. Please try again.",
        isUser: false,
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Math.floor(Date.now() / 1000)
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message) => {
    return (
      <View key={message.id} style={styles.messageContainer}>
        <View
          style={[
            styles.messageBubble,
            message.isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: message.isUser ? 'white' : textColor },
            ]}
          >
            {message.text}
          </Text>
          <Text
            style={[
              styles.timestamp,
              { color: message.isUser ? 'rgba(255,255,255,0.7)' : '#999' },
            ]}
          >
            {message.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {currentChatId ? 'Recipe Chat' : 'New Chat'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && !isLoading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={64} color="#E0E0E0" />
            <Text style={[styles.emptyText, { color: textColor }]}>
              Start a conversation about recipes and meal planning!
            </Text>
          </View>
        )}
        {messages.map(renderMessage)}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <Text style={[styles.messageText, { color: textColor }]}>
                Thinking...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.textInput, { color: textColor, borderColor: '#E0E0E0' }]}
            placeholder="Ask for recipe suggestions..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() && !isLoading ? '#4CAF50' : '#E0E0E0' },
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons
              name={isLoading ? "hourglass-outline" : "send"}
              size={20}
              color={inputText.trim() && !isLoading ? 'white' : '#999'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  recipeContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  prepTime: {
    fontSize: 14,
    opacity: 0.8,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#F5F5F5',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
    paddingHorizontal: 40,
  },
  loadingContainer: {
    marginBottom: 16,
  },
});
