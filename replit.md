# IronLog - Workout Tracker App

## Overview
IronLog is a native mobile workout tracking application designed for fast, frictionless exercise logging in gym environments. Built with Expo React Native and Express.js backend.

## Project Structure

```
├── client/                  # React Native (Expo) frontend
│   ├── App.tsx             # Root component with providers
│   ├── components/         # Reusable UI components
│   │   ├── AddExerciseModal.tsx   # Exercise search and selection
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── EmptyState.tsx         # Empty state with illustrations
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorFallback.tsx
│   │   ├── ExerciseCard.tsx       # Workout exercise with sets
│   │   ├── FAB.tsx                # Floating action button
│   │   ├── FeelingRating.tsx      # 1-10 rating component
│   │   ├── HeaderTitle.tsx
│   │   ├── LogSetModal.tsx        # Set logging modal
│   │   ├── NumericInput.tsx       # Weight/reps input
│   │   ├── Spacer.tsx
│   │   ├── ThemedText.tsx
│   │   └── ThemedView.tsx
│   ├── constants/
│   │   └── theme.ts        # Colors, spacing, typography
│   ├── data/
│   │   └── exercises.ts    # 200+ exercise database
│   ├── hooks/
│   │   ├── useColorScheme.ts
│   │   ├── useScreenOptions.ts
│   │   └── useTheme.ts
│   ├── lib/
│   │   ├── query-client.ts # API client utilities
│   │   └── storage.ts      # AsyncStorage utilities
│   ├── navigation/
│   │   ├── FavoritesStackNavigator.tsx
│   │   ├── HistoryStackNavigator.tsx
│   │   ├── LogStackNavigator.tsx
│   │   ├── MainTabNavigator.tsx   # 4-tab navigation
│   │   ├── ProfileStackNavigator.tsx
│   │   └── RootStackNavigator.tsx
│   ├── screens/
│   │   ├── FavoritesScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── LogScreen.tsx          # Main workout logging
│   │   └── ProfileScreen.tsx
│   └── types/
│       └── workout.ts      # TypeScript types
├── server/                  # Express.js backend
│   ├── index.ts
│   ├── routes.ts
│   └── storage.ts
├── assets/                  # Static assets
│   └── images/
│       └── empty-states/   # Empty state illustrations
└── shared/
    └── schema.ts           # Shared types
```

## Core Features

### MVP Features (Implemented)
- **Exercise Logging**: Log exercises with weight, reps, sets, and 1-10 feeling rating
- **Auto-populate**: Fields auto-populate from last performance
- **Favorites**: Star exercises for quick access
- **History**: Calendar view showing workout days with monthly navigation
- **Profile**: User preferences (units: lbs/kg) and workout statistics

### Navigation Structure
- **Log Tab**: Today's workout with FAB to add exercises
- **History Tab**: Calendar view with workout history (tap exercise to see graph)
- **Exercises Tab**: Full exercise database with search, filtering, and custom exercise creation
- **Profile Tab**: Settings and stats

## Technical Details

### Authentication
- User registration and login with email/password
- Session-based authentication using express-session
- Protected API routes require authentication
- Auth screens: Login and Signup with proper validation
- Profile screen shows user info and logout option

### Data Storage
**Cloud Storage (PostgreSQL via Drizzle ORM)**
- `users` - User accounts with email, password (hashed), displayName, units
- `workouts` - User workout sessions with exercises and sets (JSONB)
- `favorites` - User's favorite exercise IDs
- `exercise_history` - Last performance records per exercise

**Local Storage (AsyncStorage)**
- Used for offline caching and current workout state
- Data keys:
  - `@ironlog/workouts` - Local workout cache
  - `@ironlog/favorites` - Favorite exercise IDs
  - `@ironlog/exerciseHistory` - Last performance per exercise
  - `@ironlog/preferences` - User settings
  - `@ironlog/currentWorkout` - Active workout session

### Design System
- Primary color: `#FF3B30` (vibrant red)
- Large touch targets (60x60 pts minimum)
- High contrast for gym lighting
- System fonts for maximum legibility
- Dark mode support

### Key Components
- **FAB**: 72x72pt floating action button with subtle pulse animation
- **FeelingRating**: 10 circular buttons with color coding (green=easy, orange=moderate, red=hard)
- **ExerciseCard**: Displays exercise with sets and inline editing
- **NumericInput**: Large stepper with +/- buttons for weight/reps

## Running the App

### Development
```bash
npm run expo:dev    # Start Expo dev server (port 8081)
npm run server:dev  # Start Express backend (port 5000)
```

### Workflows
- **Start Frontend**: `npm run expo:dev` - Expo development server
- **Start Backend**: `npm run server:dev` - Express API server

## Recent Changes
- January 21, 2026: Multi-user authentication system
  - Added PostgreSQL database with Drizzle ORM
  - User registration and login with email/password
  - Session-based authentication (express-session + bcryptjs)
  - Login and Signup screens with validation
  - Profile screen with logout functionality
  - Protected API routes for workouts, favorites, exercise history
  - Database schema: users, workouts, favorites, exercise_history tables
  
- January 2026: Initial MVP implementation
  - 4-tab navigation (Log, History, Favorites, Profile)
  - 200+ exercise database
  - Local storage with AsyncStorage
  - Feeling rating system (1-10 scale)
  - Calendar-based history view
  - Unit toggle (lbs/kg)
