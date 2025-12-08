import { GROQ_API_KEY } from '@env';

/**
 * Groq API Service for handling chat completions
 * This service integrates with Groq API to provide AI responses for the chat feature
 */

class GroqService {
  constructor() {
    this.API_URL = "https://api.groq.com/openai/v1/chat/completions";
    this.MODEL = "llama-3.1-8b-instant";
    this.API_KEY = GROQ_API_KEY;
    
    this.PREDEFINED_PROMPT = `You are a helpful AI assistant specializing in meal planning and recipe suggestions for people with ADHD and various dietary needs. 

You help users:
- Create recipes based on their inventory
- Suggest ADHD-friendly meals (simple, nutritious, easy to prepare)
- Consider dietary goals and medical conditions
- Provide clear, step-by-step cooking instructions
- Suggest ingredient substitutions

Keep responses concise, friendly, and actionable. Focus on practical cooking advice.`;
  }

  /**
   * Clean response by removing thinking blocks and extra whitespace
   */
  clean(response) {
    return String(response || "")
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .trim()
      .replace(/\n\s*\n\s*\n/g, "\n\n");
  }

  /**
   * Build enhanced system prompt with user context information
   * @param {Object} userContext - User's profile, preferences, and inventory data
   * @returns {string} - Enhanced system prompt with user information
   */
  buildEnhancedPrompt(userContext) {
    let enhancedPrompt = this.PREDEFINED_PROMPT;

    if (userContext) {
      enhancedPrompt += "\n\n--- USER CONTEXT ---\n";

      // Add user profile information
      if (userContext.profile) {
        const profile = userContext.profile;
        enhancedPrompt += `USER PROFILE:
- Name: ${profile.name || 'Not specified'}
- Age: ${profile.age || 'Not specified'}
- Blood Group: ${profile.bloodGroup || 'Not specified'}
- Email: ${profile.email || 'Not specified'}`;
      }

      // Add user preferences
      if (userContext.preferences) {
        const prefs = userContext.preferences;
        enhancedPrompt += "\n\nUSER PREFERENCES:";
        
        if (prefs.medicalConditions && prefs.medicalConditions.length > 0) {
          enhancedPrompt += `\n- Medical Conditions: ${prefs.medicalConditions.join(', ')}`;
        }
        
        if (prefs.dietaryGoals && prefs.dietaryGoals.length > 0) {
          enhancedPrompt += `\n- Dietary Goals: ${prefs.dietaryGoals.join(', ')}`;
        }
        
        if (prefs.allergies && prefs.allergies.length > 0) {
          enhancedPrompt += `\n- Allergies: ${prefs.allergies.join(', ')}`;
        }
      }

      // Add user inventory information
      if (userContext.inventory) {
        const inventoryItems = Object.entries(userContext.inventory)
          .filter(([id, item]) => !item.isDeleted)
          .map(([id, item]) => {
            let itemInfo = `${item.name} (${item.quantity})`;
            if (item.expiryDate) {
              const expiryDate = new Date(item.expiryDate * 1000).toLocaleDateString();
              itemInfo += ` - expires: ${expiryDate}`;
            }
            return itemInfo;
          });

        if (inventoryItems.length > 0) {
          enhancedPrompt += "\n\nUSER INVENTORY:";
          inventoryItems.forEach(item => {
            enhancedPrompt += `\n- ${item}`;
          });
        }
      }

      enhancedPrompt += "\n\nPlease use this user context to provide personalized meal suggestions and recipes that match their preferences, medical conditions, dietary goals, and available ingredients.";
    }

    return enhancedPrompt;
  }

  /**
   * Send a message to Groq API and get AI response
   * @param {string} userMessage - The user's message
   * @param {Array} conversationHistory - Previous messages for context (optional)
   * @param {Object} userContext - User's profile, preferences, and inventory data (optional)
   * @returns {Promise<string>} - The AI's response
   */
  async getResponse(userMessage, conversationHistory = [], userContext = null) {
    if (!this.API_KEY || this.API_KEY === "YOUR_GROQ_API_KEY") {
      console.warn("Set GROQ_API_KEY in your environment.");
      return "I'm sorry, but I'm not properly configured right now. Please check the API key configuration.";
    }

    try {
      // Build enhanced system prompt with user context
      const systemPrompt = this.buildEnhancedPrompt(userContext);
      
      // Build messages array with conversation history
      const messages = [
        {
          role: "system",
          content: systemPrompt
        }
      ];

      // Add conversation history (last 10 messages for context)
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach(msg => {
        messages.push({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content
        });
      });

      // Add current user message
      messages.push({
        role: "user",
        content: userMessage
      });

      const requestBody = {
        model: this.MODEL,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      };
      console.log("requestBody", requestBody);

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status} ${response.statusText} — ${errorText}`);
      }

      const data = await response.json();

      // Extract response from different possible formats
      let aiResponse;

      // Standard OpenAI format
      if (data.choices && data.choices.length > 0) {
        aiResponse = data.choices[0].message?.content || data.choices[0].text;
      }
      // Direct message format
      else if (data.message) {
        aiResponse = typeof data.message === "string" ? data.message : data.message.content;
      }
      // Direct content format
      else if (data.content) {
        aiResponse = typeof data.content === "string" ? data.content : data.content.text;
      }
      // Direct text format
      else if (data.text) {
        aiResponse = data.text;
      }

      if (!aiResponse) {
        throw new Error("No response content found in API response");
      }

      const cleanedResponse = this.clean(aiResponse);
      console.log("Groq API Response:", cleanedResponse);
      
      return cleanedResponse;

    } catch (error) {
      console.error("Groq API Error:", error.message || error);
      return "I'm having trouble processing your request right now. Please try again in a moment.";
    }
  }

  /**
   * Generate a conversation title based on the first user message
   * @param {string} firstMessage - The first message in the conversation
   * @returns {string} - A generated title
   */
  generateConversationTitle(firstMessage) {
    // Simple title generation based on keywords
    const message = firstMessage.toLowerCase();
    
    if (message.includes('recipe') || message.includes('cook')) {
      return "Recipe Suggestions";
    } else if (message.includes('diet') || message.includes('meal')) {
      return "Diet & Meal Planning";
    } else if (message.includes('ingredient') || message.includes('inventory')) {
      return "Ingredient Help";
    } else if (message.includes('healthy') || message.includes('nutrition')) {
      return "Healthy Eating";
    } else {
      // Take first few words as title
      const words = firstMessage.split(' ').slice(0, 4).join(' ');
      return words.length > 30 ? words.substring(0, 27) + "..." : words;
    }
  }
}

// Export singleton instance
export const groqService = new GroqService();
export default groqService;
