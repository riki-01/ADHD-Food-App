# ADHD Food App

A mobile application designed to help individuals with ADHD manage their eating habits through intuitive meal planning and tracking.

NOTE: The main branch of the repository is named as final. Make sure to switch to this branch before running the project. 

## 🚀 Features

### Authentication
- Secure sign-up and sign-in using Clerk
- Email verification
- Session management

### Home Screen
- Personalized greeting
- Today's date display
- Meal schedule with time slots
- Quick action buttons
- Clean, ADHD-friendly interface
- Sign out button

### UI/UX
- ADHD-friendly color schemes
- High contrast text for better readability
- Clear visual hierarchy
- Consistent spacing and typography
- Touch-friendly interactive elements


### Color Themes
- Ocean - Calm and focused
- Coffee - Warm and comforting
- Forest - Natural and refreshing
- Purple - Creative and stimulating


## 🛠 Tech Stack

- **Frontend**: React Native
- **Navigation**: Expo Router
- **Authentication**: Clerk
- **State Management**: React Context
- **Styling**: StyleSheet

## 📂 Project Structure

```
ADHD_mobile/
├── app/
│   ├── (auth)/
│   │   ├── sign-in.jsx
│   │   └── sign-up.jsx
│   ├── (root)/
│   │   └── index.jsx
│   └── _layout.jsx
├── assets/
│   └── styles/
│       ├── auth.styles.js
│       └── home.styles.js
├── components/
│   ├── PageLoader.jsx
│   ├── SafeScreen.jsx
│   └── SignOutButton.jsx
├── constants/
│   └── colors.js
├── docs/
│   ├── ADS.pdf
│   ├── DDS.pdf
│   ├── SRS.pdf
│   ├── ProjectCharter.pdf
│   └── PosterDesign.pdf
│       
└── README.md

```


## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm (v8 or later)
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ADHD-Food-App.git
   cd ADHD-Food-App
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Clerk publishable key:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
   ```

4. Start the development server:
   ```bash
   npx expo start
   ```

5. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan the QR code with Expo Go app on your physical device


   

