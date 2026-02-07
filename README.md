# 🍺 AI Beer Sommelier

**Your Personal AI-Powered Beer Expert**

A premium React Native (Expo) + TypeScript app that learns your taste and recommends the perfect beer for any occasion. Powered by AI, built with Firebase.

**Domain:** [aibeersommelier.com](https://aibeersommelier.com)

---

## ✨ What Makes This Different

Unlike generic beer logging apps, AI Beer Sommelier is an **intelligent companion** that:

- 🧠 **Learns Your Taste** - AI-powered flavor profiling that gets smarter with every rating
- 💬 **Answers Beer Questions** - "What pairs with pizza?" "Hot day beer?" — real AI recommendations
- 🎯 **Personalized Matches** - See compatibility scores for any beer based on YOUR palate
- 🏆 **Gamified Experience** - 30+ achievements, daily challenges, leveling system
- 📸 **Share-Worthy Cards** - Beautiful Instagram-ready beer cards
- 🍃 **Mindful Drinking** - Health insights and moderation tracking (App Store loves this)
- 📅 **Memories** - "On this day 1 year ago..." nostalgia feature

---

## 🚀 Features

### Core Experience
- 🔐 **Authentication** - Email/password and Google Sign-In
- 📷 **Barcode Scanning** - Scan any beer for instant lookup
- 📝 **Smart Logging** - Quick log or detailed entries with photos, location, notes
- 🔄 **Offline-First** - Works without internet, syncs when connected
- 🗺️ **Map View** - See your beer journey geographically
- 🔍 **Search & Filter** - Find any beer by name, style, rating, location

### AI-Powered Intelligence
- 🧠 **AI Sommelier Chat** - Ask anything about beer, get personalized answers
- 📊 **Flavor Profiling** - 7 dimensions: bitterness, sweetness, roast, fruit, spice, body, sour
- 🎯 **Match Scores** - Every beer shows how well it fits your taste
- 💡 **Smart Recommendations** - Based on your history, not generic suggestions
- 🍕 **Food Pairing** - AI suggests what beers pair with your meal

### Engagement & Retention
- 🏆 **30+ Achievements** - From "First Sip" to "Certified Sommelier"
- 📈 **10 Levels** - Newbie → Enthusiast → Connoisseur → Legend
- 🎯 **Daily Challenges** - 3 new challenges every day with rewards
- 📅 **On This Day** - Beer memories from previous years
- 📊 **Rich Insights** - Stats, trends, and analytics about your drinking

### Health & Moderation
- 📆 **Dry Days Calendar** - Track alcohol-free days
- 📉 **Drinking Stats** - Weekly averages, trends over time
- 🏥 **CDC Guidelines** - Gentle moderation awareness
- 🏆 **Moderation Achievements** - Rewards for healthy habits

### Social & Sharing
- 📸 **Share Cards** - 6 beautiful themes for Instagram/social
- 🌐 **Community** - Optional public sharing with privacy controls
- 📤 **Export** - Full CSV export of your diary
- 📱 **Wishlist** - Save beers to try with priority levels

---

## 📱 Screens

### Auth Flow
- **LoginScreen** - Beautiful gradient login with Google Sign-In
- **SignUpScreen** - Quick registration flow
- **OnboardingScreen** - 5-slide animated intro to the app

### Main Tabs
- **DiaryScreen** - Your beer journal with search and filters
- **SommelierScreen** - AI chat for recommendations (⭐ THE killer feature)
- **InsightsScreen** - Statistics and analytics dashboard
- **ProfileScreen** - Your profile, achievements, settings

### Premium Features
- **FlavorProfileScreen** - Your AI-learned taste profile
- **WishlistScreen** - Beers you want to try
- **AchievementsScreen** - 30+ badges and level progress
- **StyleGuideScreen** - 25+ beer styles with descriptions
- **DrinkingStatsScreen** - Health and moderation tracking
- **ShareCardScreen** - Create shareable beer cards

---

## 🛠️ Tech Stack

- **Frontend**: Expo (React Native) + TypeScript
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions)
- **AI**: OpenAI GPT-4 / Anthropic Claude (configurable)
- **State**: React Query + Context
- **Validation**: Zod schemas
- **Maps**: react-native-maps
- **Geo**: Custom geohash for proximity queries

---

## 📂 Project Structure

```
ai-beer-sommelier/
├── app/                    # Expo React Native app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── common/     # Button, Input, Card, etc.
│   │   │   ├── entry/      # Entry-specific components
│   │   │   └── engagement/ # OnThisDay, DailyChallenge
│   │   ├── screens/        # All screen components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # Firebase, AI, and API services
│   │   ├── data/           # Static data (achievements, styles, profiles)
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript types
│   │   ├── providers/      # Context providers
│   │   └── config/         # App configuration
│   ├── App.tsx
│   ├── app.json
│   └── package.json
├── functions/              # Firebase Cloud Functions
├── firebase.json
├── firestore.rules
├── storage.rules
└── firestore.indexes.json
```

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project (Blaze plan for Cloud Functions)
- OpenAI API key (for AI sommelier features)

### 1. Clone & Install

```bash
cd app
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable: Authentication, Firestore, Storage, Functions
3. Create `app/src/config/firebase.config.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 3. AI Configuration

Create `app/src/config/ai.config.ts`:

```typescript
export const aiConfig = {
  provider: 'openai', // or 'anthropic'
  apiKey: 'your-openai-api-key',
  model: 'gpt-4-turbo-preview'
};
```

### 4. Deploy Firebase

```bash
firebase deploy --only firestore:rules,storage:rules,firestore:indexes,functions
```

### 5. Run the App

```bash
npx expo start
```

---

## 🔒 Security

- Private entries only readable by owner
- Location data never exposed publicly
- EXIF GPS stripped from uploaded images
- Secure AI API key handling

---

## 📈 Why This Wins

| Feature | Beer Diary Apps | AI Beer Sommelier |
|---------|-----------------|-------------------|
| AI Recommendations | ❌ | ✅ Personalized AI chat |
| Taste Learning | ❌ | ✅ 7-dimension profiling |
| Match Scores | ❌ | ✅ "92% match for you" |
| Health Tracking | ❌ | ✅ Moderation features |
| Daily Challenges | ❌ | ✅ Retention driver |
| Social Sharing | Basic | ✅ Instagram-worthy cards |
| Memories | ❌ | ✅ "On this day..." |

**This isn't a beer diary. It's a beer relationship.**

---

## 📄 License

MIT

---

*Built with 🍺 by AI Beer Sommelier*
