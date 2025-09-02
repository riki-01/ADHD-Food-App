# ADHD Food App

A mobile application designed to help individuals with ADHD manage their eating habits through intuitive meal planning and tracking.

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

### UI/UX
- ADHD-friendly color schemes
- High contrast text for better readability
- Clear visual hierarchy
- Consistent spacing and typography
- Touch-friendly interactive elements

## 🎨 Design System

### Color Themes
- Ocean (default)
- Coffee
- Forest
- Purple

### Typography
- Clear, readable fonts
- Consistent text hierarchy
- Sufficient contrast ratios

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
└── constants/
    └── colors.js
```

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables for Clerk
4. Start the development server:
   ```bash
   npx expo start
   ```

## 🎯 Next Steps

- [ ] Implement meal logging functionality
- [ ] Add barcode scanning for food items
- [ ] Create meal planning calendar
- [ ] Add notifications for meal times
- [ ] Implement user profile management

## 🤝 Contributing

Feel free to submit issues and enhancement requests.

## 📝 License

This project is [MIT licensed](LICENSE).
