import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { 
  STYLE_PROFILES, 
  UserTasteProfile, 
  createDefaultProfile,
  calculateStyleMatch,
} from '@/data/flavorProfile';

const { width } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendations?: BeerRecommendation[];
  timestamp: Date;
}

interface BeerRecommendation {
  name: string;
  style: string;
  matchScore: number;
  reason: string;
  pairsWith?: string;
}

// ============================================
// QUICK PROMPTS
// ============================================

const QUICK_PROMPTS = [
  { emoji: '🍻', text: "What beer should I try tonight?" },
  { emoji: '🍕', text: "What pairs with pizza?" },
  { emoji: '☀️', text: "Best beer for a hot day?" },
  { emoji: '🌧️', text: "Cozy beer for a rainy night?" },
  { emoji: '🎉', text: "Something special to celebrate?" },
  { emoji: '🆕', text: "Help me try something new" },
];

// ============================================
// AI SOMMELIER LOGIC
// ============================================

const generateSommelierResponse = (
  userMessage: string,
  userProfile: UserTasteProfile
): { response: string; recommendations?: BeerRecommendation[] } => {
  const lowerMsg = userMessage.toLowerCase();
  
  // Get user's top styles based on profile
  const styleMatches = STYLE_PROFILES.map(style => ({
    style,
    score: calculateStyleMatch(userProfile, style),
  })).sort((a, b) => b.score - a.score);
  
  const topMatches = styleMatches.slice(0, 3);
  const adventurousPicks = styleMatches.slice(-3).reverse();
  
  // Pizza pairing
  if (lowerMsg.includes('pizza')) {
    return {
      response: "Pizza and beer are a classic combo! 🍕🍺\n\nFor a margherita or cheese pizza, I'd go with something crisp. For pepperoni or meat lovers, you want something that can stand up to the richness.",
      recommendations: [
        { name: 'Pilsner', style: 'Lager', matchScore: 92, reason: 'Crisp & refreshing cuts through cheese', pairsWith: 'Margherita, cheese pizza' },
        { name: 'Pale Ale', style: 'Ale', matchScore: 88, reason: 'Hoppy bite matches pepperoni spice', pairsWith: 'Pepperoni, meat lovers' },
        { name: 'Amber Lager', style: 'Lager', matchScore: 85, reason: 'Malty sweetness loves tomato sauce', pairsWith: 'Any pizza!' },
      ],
    };
  }
  
  // Hot day
  if (lowerMsg.includes('hot') || lowerMsg.includes('summer') || lowerMsg.includes('sunny')) {
    return {
      response: "Nothing beats a cold beer on a hot day! ☀️\n\nYou want something light, crisp, and super refreshing. Low ABV so you can have a few without getting wrecked.",
      recommendations: [
        { name: 'Pilsner', style: 'Lager', matchScore: 95, reason: 'The ultimate thirst quencher', pairsWith: 'BBQ, light snacks' },
        { name: 'Hefeweizen', style: 'Wheat', matchScore: 90, reason: 'Fruity, refreshing, perfect poolside', pairsWith: 'Salads, seafood' },
        { name: 'Gose', style: 'Sour', matchScore: 88, reason: 'Tart & salty — like a beer margarita', pairsWith: 'Tacos, ceviche' },
      ],
    };
  }
  
  // Rainy/cozy
  if (lowerMsg.includes('rain') || lowerMsg.includes('cozy') || lowerMsg.includes('cold') || lowerMsg.includes('winter')) {
    return {
      response: "Cozy weather calls for cozy beers! 🌧️\n\nThink rich, warming, maybe something with chocolate or coffee notes. These are sipping beers, not chugging beers.",
      recommendations: [
        { name: 'Imperial Stout', style: 'Ale', matchScore: 94, reason: 'Rich, warming, like a hug in a glass', pairsWith: 'Chocolate, cheese' },
        { name: 'Belgian Dubbel', style: 'Belgian', matchScore: 91, reason: 'Dark fruit, caramel, perfect fireside', pairsWith: 'Stews, roasts' },
        { name: 'Doppelbock', style: 'Lager', matchScore: 88, reason: 'Liquid bread — malty & satisfying', pairsWith: 'Pretzels, sausage' },
      ],
    };
  }
  
  // Celebration
  if (lowerMsg.includes('celebrat') || lowerMsg.includes('special') || lowerMsg.includes('occasion')) {
    return {
      response: "Time to pop something special! 🎉\n\nThese are the beers you save for moments that matter. Complex, interesting, memorable.",
      recommendations: [
        { name: 'Belgian Tripel', style: 'Belgian', matchScore: 93, reason: 'Elegant, complex, deceptively strong', pairsWith: 'Lobster, crab' },
        { name: 'Barrel-Aged Stout', style: 'Ale', matchScore: 90, reason: 'Bourbon notes, luxurious sipping', pairsWith: 'Dark chocolate, desserts' },
        { name: 'Lambic/Gueuze', style: 'Sour', matchScore: 87, reason: 'Champagne of beers — funky & special', pairsWith: 'Charcuterie, soft cheese' },
      ],
    };
  }
  
  // Try something new
  if (lowerMsg.includes('new') || lowerMsg.includes('different') || lowerMsg.includes('adventure')) {
    return {
      response: "Love the adventurous spirit! 🗺️\n\nBased on your taste profile, here are some styles you haven't explored much that I think you'd dig:",
      recommendations: adventurousPicks.map(({ style, score }) => ({
        name: style.styleName,
        style: style.category,
        matchScore: Math.round(100 - score + 50), // Flip it — lower match = more adventurous
        reason: style.description,
      })),
    };
  }
  
  // Tonight / general recommendation
  if (lowerMsg.includes('tonight') || lowerMsg.includes('should i') || lowerMsg.includes('recommend')) {
    return {
      response: "Based on your taste profile, here's what I think you'd love tonight! 🍺\n\nI've learned you tend to enjoy " + 
        (userProfile.preferences.fruit > 3.5 ? "fruity, " : "") +
        (userProfile.preferences.bitterness > 3 ? "hoppy " : "balanced ") +
        "beers. These should hit the spot:",
      recommendations: topMatches.map(({ style, score }) => ({
        name: style.styleName,
        style: style.category,
        matchScore: Math.round(score),
        reason: style.description,
      })),
    };
  }
  
  // Default response
  return {
    response: "I'm your personal beer sommelier! 🍺\n\nI know your taste profile and can recommend the perfect beer for any situation. Try asking me:\n\n• What should I try tonight?\n• What pairs with [food]?\n• Something for a special occasion\n• Help me try something new\n\nOr just tell me what you're in the mood for!",
  };
};

// ============================================
// MESSAGE BUBBLE
// ============================================

interface MessageBubbleProps {
  message: Message;
  onRecommendationPress: (rec: BeerRecommendation) => void;
}

function MessageBubble({ message, onRecommendationPress }: MessageBubbleProps): JSX.Element {
  const isUser = message.role === 'user';
  
  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>🍺</Text>
          </LinearGradient>
        </View>
      )}
      
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {message.content}
        </Text>
        
        {/* Recommendations */}
        {message.recommendations && message.recommendations.length > 0 && (
          <View style={styles.recommendations}>
            {message.recommendations.map((rec, i) => (
              <TouchableOpacity
                key={i}
                style={styles.recCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onRecommendationPress(rec);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.recHeader}>
                  <Text style={styles.recName}>{rec.name}</Text>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchText}>{rec.matchScore}%</Text>
                  </View>
                </View>
                <Text style={styles.recStyle}>{rec.style}</Text>
                <Text style={styles.recReason}>{rec.reason}</Text>
                {rec.pairsWith && (
                  <View style={styles.pairsRow}>
                    <Ionicons name="restaurant-outline" size={12} color="#6B7280" />
                    <Text style={styles.pairsText}>Pairs with: {rec.pairsWith}</Text>
                  </View>
                )}
                <View style={styles.recAction}>
                  <Text style={styles.recActionText}>Add to wishlist →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SommelierScreen(): JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Mock user profile - would come from Firebase
  const userProfile: UserTasteProfile = {
    ...createDefaultProfile('user123'),
    preferences: {
      bitterness: 3.8,
      sweetness: 2.5,
      roast: 2.0,
      fruit: 4.2,
      spice: 2.8,
      body: 3.0,
      sour: 1.5,
    },
    confidence: {
      bitterness: 12,
      sweetness: 10,
      roast: 8,
      fruit: 15,
      spice: 6,
      body: 11,
      sour: 4,
    },
    totalRatings: 45,
  };
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hey! I'm your personal beer sommelier 🍺\n\nI've studied your taste profile from your 45 ratings. I know you like fruity, hoppy beers and aren't big on sours.\n\nHow can I help you find your next great beer?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    
    // Simulate AI thinking
    setTimeout(() => {
      const { response, recommendations } = generateSommelierResponse(text, userProfile);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        recommendations,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1000 + Math.random() * 500);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  const handleRecommendationPress = (rec: BeerRecommendation) => {
    // Add to wishlist or show details
    const wishlistMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Added "${rec.name}" to your wishlist! 📝\n\nNext time you see it, you'll know it's a ${rec.matchScore}% match for your taste. Happy hunting!`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, wishlistMessage]);
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Sommelier</Text>
          <Text style={styles.headerSubtitle}>Your personal beer expert</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>
      
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 60}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onRecommendationPress={handleRecommendationPress}
            />
          ))}
          
          {isTyping && (
            <View style={styles.messageRow}>
              <View style={styles.avatarContainer}>
                <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.avatar}>
                  <Text style={styles.avatarText}>🍺</Text>
                </LinearGradient>
              </View>
              <View style={[styles.bubble, styles.bubbleAssistant]}>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
                  <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>
        
        {/* Quick Prompts */}
        {messages.length <= 2 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPrompts}
          >
            {QUICK_PROMPTS.map((prompt, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickPrompt}
                onPress={() => sendMessage(prompt.text)}
              >
                <Text style={styles.quickPromptEmoji}>{prompt.emoji}</Text>
                <Text style={styles.quickPromptText}>{prompt.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        
        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything about beer..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isTyping}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? '#FFF' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    padding: 14,
  },
  bubbleUser: {
    backgroundColor: '#F59E0B',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  bubbleTextUser: {
    color: '#FFF',
  },
  
  // Recommendations
  recommendations: {
    marginTop: 12,
    gap: 8,
  },
  recCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  matchBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  recStyle: {
    fontSize: 13,
    color: '#B45309',
    marginBottom: 4,
  },
  recReason: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  pairsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  pairsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  recAction: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  recActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
  },
  
  // Typing
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  
  // Quick Prompts
  quickPrompts: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  quickPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickPromptEmoji: {
    fontSize: 16,
  },
  quickPromptText: {
    fontSize: 14,
    color: '#374151',
  },
  
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
    color: '#111827',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});
