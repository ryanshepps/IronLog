# Workout Tracker - Design Guidelines

## 1. Brand Identity

**Purpose**: Frictionless workout logging for gym-goers who need to track progress between sets, in bright lighting, with sweaty hands.

**Aesthetic Direction**: **Brutally minimal with bold kinetic energy**
- Stark, high-contrast interface optimized for gym lighting
- Maximum whitespace, essential elements only
- One bold accent color for primary actions that SCREAMS "tap here"
- Large, confident touch targets (minimum 60x60 pts)
- Zero decorative elements that don't serve the workout flow

**Memorable Element**: The "Quick Add" floating action button - a bold, impossibly-large circular button that pulses subtly when idle, positioned for one-handed thumb access. It's the app's beating heart.

## 2. Navigation Architecture

**Root Navigation**: Tab Bar (4 tabs)

**Tabs** (left to right):
1. **Log** - Active workout logging (home)
2. **History** - Calendar view with search
3. **Favorites** - Quick-access exercise list
4. **Profile** - Settings and preferences

**Floating Action Button**: "Quick Add Set" appears on Log tab only, positioned bottom-right for thumb reach.

## 3. Screen-by-Screen Specifications

### 3.1 Log Screen (Home)
**Purpose**: Primary workout logging interface.

**Layout**:
- Header: Transparent, centered title "Today's Workout", right button "Done Workout"
- Main content: ScrollView
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xxl + 80 (FAB clearance)
- Floating FAB: Bottom-right, 72x72 pts
  - Position: 20 pts from right edge, tabBarHeight + 20 from bottom

**Components**:
- Exercise cards (stacked vertically, Spacing.lg between)
  - Exercise name (large, bold)
  - Set history rows (weight, reps, feeling rating dots)
  - "Add Set" button (full-width, inside card)
- Empty state: Large illustration, "Start your workout" heading

**Empty State**: When no exercises logged today.

### 3.2 Add Exercise Modal (launched from FAB)
**Purpose**: Search and select exercise to add.

**Layout**:
- Native modal (slides up from bottom)
- Header: "Add Exercise", left "Cancel", right "Favorites" icon button
- Search bar: Prominent, top of content, autofocus on appear
- Main content: Scrollable list
  - Top inset: Spacing.xl (below search)
  - Bottom inset: insets.bottom + Spacing.xl

**Components**:
- Search bar with autocomplete
- Exercise list items (name + last performance preview)
- "New Exercise" button if search has no results

### 3.3 Log Set Modal
**Purpose**: Input reps, weight, feeling for a set.

**Layout**:
- Native modal (centered sheet on iOS, full-screen on small devices)
- Header: Exercise name, left "Cancel", right "Save"
- Form: Non-scrollable (fixed layout)
  - Weight input (large, numeric keyboard)
  - Reps input (large, numeric keyboard)
  - Feeling rating: 10 large circular buttons (1-10), single-select
- Buttons: Save (bold accent color), Cancel (text only)

**Components**:
- Large numeric inputs (auto-populated from last set)
- Feeling rating circles (44x44 pts minimum, haptic feedback on tap)

### 3.4 History Screen
**Purpose**: View past workouts via calendar or search.

**Layout**:
- Header: "History", right "Search" icon button
- Main content: ScrollView
  - Monthly calendar at top (dots on workout days)
  - Workout list below (grouped by date)
  - Top inset: Spacing.xl (transparent header)
  - Bottom inset: tabBarHeight + Spacing.xl

**Components**:
- Calendar grid (native-styled)
- Workout cards (date header, exercise summaries)
- Empty state: "No workouts yet" illustration

### 3.5 Search Exercises Screen (from History)
**Purpose**: Search exercise name to see progression history.

**Layout**:
- Header: Transparent, search bar embedded
- Main content: ScrollView (exercise history list)
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl

**Components**:
- Search bar
- Exercise history cards (date, sets/reps/weight, trend indicator)

### 3.6 Favorites Screen
**Purpose**: Quick access to favorite exercises.

**Layout**:
- Header: "Favorites", right "Edit" button
- Main content: List (reorderable in edit mode)
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl

**Components**:
- Exercise list items (name, last logged, star icon)
- Empty state: "No favorites" illustration

### 3.7 Profile Screen
**Purpose**: Settings and preferences.

**Layout**:
- Header: "Profile", transparent
- Main content: ScrollView
  - Avatar + display name at top
  - Settings sections below
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl

**Components**:
- Avatar (preset illustration, tappable to change)
- Display name field
- Settings groups: Units (kg/lbs toggle), Theme (auto/light/dark), Data Export

## 4. Color Palette

**Primary**: `#FF3B30` (Vibrant red - impossible to miss, signals action/energy)
**Background**: `#FFFFFF` (light mode), `#000000` (dark mode)
**Surface**: `#F5F5F5` (light mode), `#1C1C1E` (dark mode)
**Text Primary**: `#000000` (light mode), `#FFFFFF` (dark mode)
**Text Secondary**: `#6E6E73`
**Border**: `#E5E5EA` (light mode), `#38383A` (dark mode)
**Success**: `#34C759` (for PR indicators)
**Semantic**:
- Feeling 1-3 (too easy): `#34C759`
- Feeling 4-7 (just right): `#FF9500`
- Feeling 8-10 (maximum effort): `#FF3B30`

## 5. Typography

**Font**: System default (SF Pro on iOS, Roboto on Android) for maximum legibility at all sizes.

**Type Scale**:
- Hero: 34 pt, Bold (screen titles)
- Title: 24 pt, Bold (exercise names)
- Body Large: 20 pt, Semibold (input fields, key data)
- Body: 17 pt, Regular (list items, secondary text)
- Caption: 13 pt, Regular (metadata, timestamps)

## 6. Assets to Generate

**Required**:
1. `icon.png` - App icon: Red dumbbell silhouette on white circle, minimal
2. `splash-icon.png` - Splash icon: Same as app icon
3. `empty-workout.png` - Empty state for Log screen: Simple outline of person lifting, neutral gray
4. `empty-history.png` - Empty state for History screen: Simple calendar with checkmark, neutral gray
5. `empty-favorites.png` - Empty state for Favorites screen: Star outline, neutral gray

**Avatars** (for Profile screen):
6. `avatar-1.png` - Geometric strength icon (triangle)
7. `avatar-2.png` - Geometric endurance icon (circle)
8. `avatar-3.png` - Geometric power icon (square)

**Style for all assets**: Stark, geometric, minimal. Use only black/white/gray with red accent. Avoid gradients, shadows, or realism.