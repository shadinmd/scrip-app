# Scrip App

**Scrip** is a mobile application for personal finance and loan management. Built with React Native and Expo, it offers a clean and intuitive interface for tracking accounts, expenses, and loans on both iOS and Android.

## 🔗 Related Repositories
- **Backend API:** [scrip-backend](https://github.com/shadinmd/scrip-backend.git)

## 🚀 Tech Stack
- **Framework:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Navigation:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Styling:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **API Interaction:** [Axios](https://axios-http.com/) with request/response interceptors
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Charts:** [React Native Wagmi Charts](https://github.com/coinjar/react-native-wagmi-charts)
- **Icons:** [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)
- **Animations:** [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

## ✨ Features
- **Dashboard:** At-a-glance view of net worth, income, and expenses with interactive charts.
- **Account Tracking:** Manage multiple financial accounts and view detailed transaction history.
- **Loan Management:** Track loans, view repayment progress, and manage installments.
- **Transaction Logging:** Quickly record income and expenses with categorized entries.
- **Authentication:** Secure user login and registration with automated token refresh.
- **Push Notifications:** Stay informed about loan due dates and account updates.
- **Themes:** Modern UI built with Tailwind CSS (NativeWind) for consistent styling.

## 📂 Project Structure
```text
frontend/
├── app/                # File-based routing (screens and layouts)
│   ├── (auth)/         # Login and registration screens
│   ├── (settings)/     # Profile, account, and loan management screens
│   ├── (tabs)/         # Bottom tab navigation (Dashboard, Accounts, etc.)
│   └── _layout.tsx     # Root layout with navigation setup
├── assets/             # Images, fonts, and static resources
├── components/         # Reusable UI components
├── lib/                # API, Auth, and State management logic
├── types/              # TypeScript definitions for data models
└── tailwind.config.js  # Tailwind CSS configuration
```

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) installed.
- [Expo Go](https://expo.dev/expo-go) app on your mobile device (for development).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/shadinmd/scrip-app
   cd scrip-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration
Create a `.env.local` file in the root directory and specify the backend API URL:
```env
EXPO_PUBLIC_API_URL=http://your-backend-ip:8000/api
```

### Running the App
- **Start Development Server:**
  ```bash
  npm run dev
  ```
- **Run on Android:**
  ```bash
  npm run android
  ```
- **Run on iOS:**
  ```bash
  npm run ios
  ```

## 📜 Available Scripts
- `npm run dev`: Starts the Expo development server.
- `npm run android`: Opens the app in an Android emulator or connected device.
- `npm run ios`: Opens the app in an iOS simulator.
- `npm run clean`: Clears Expo cache and reinstalls node_modules.
