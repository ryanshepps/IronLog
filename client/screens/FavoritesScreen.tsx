import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  Layout,
} from "react-native-reanimated";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Exercise, ExerciseHistory, UserPreferences } from "@/types/workout";
import { EXERCISES, getExerciseById } from "@/data/exercises";
import {
  getFavorites,
  removeFavorite,
  getAllExerciseHistory,
  getPreferences,
} from "@/lib/storage";

const emptyFavoritesImage = require("../../assets/images/empty-states/empty-favorites.png");

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FavoriteItem({
  exercise,
  history,
  units,
  onRemove,
  index,
}: {
  exercise: Exercise;
  history?: ExerciseHistory;
  units: "kg" | "lbs";
  onRemove: () => void;
  index: number;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(200)}
      layout={Layout.springify()}
    >
      <AnimatedPressable
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[
          styles.favoriteItem,
          { backgroundColor: theme.backgroundSecondary },
          animatedStyle,
        ]}
      >
        <View style={styles.favoriteInfo}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {exercise.name}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {exercise.category}
            {history
              ? ` • Last: ${history.lastWeight}${units} x ${history.lastReps} • ${formatDate(history.lastPerformed)}`
              : " • Not logged yet"}
          </ThemedText>
          {history?.personalRecord ? (
            <View style={styles.prBadge}>
              <Feather name="award" size={12} color={theme.warning} />
              <ThemedText
                type="caption"
                style={{ color: theme.warning, marginLeft: 4 }}
              >
                PR: {history.personalRecord}
                {units}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onRemove();
          }}
          hitSlop={12}
          style={styles.removeButton}
        >
          <Feather name="star" size={22} color={theme.warning} />
        </Pressable>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function FavoritesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const [favorites, setFavorites] = useState<string[]>([]);
  const [exerciseHistory, setExerciseHistory] = useState<
    Record<string, ExerciseHistory>
  >({});
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const loadData = useCallback(async () => {
    const [favs, history, prefs] = await Promise.all([
      getFavorites(),
      getAllExerciseHistory(),
      getPreferences(),
    ]);
    setFavorites(favs);
    setExerciseHistory(history);
    setPreferences(prefs);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRemoveFavorite = async (exerciseId: string) => {
    await removeFavorite(exerciseId);
    setFavorites((prev) => prev.filter((id) => id !== exerciseId));
  };

  const favoriteExercises = favorites
    .map((id) => getExerciseById(id))
    .filter((e): e is Exercise => e !== undefined);

  const units = preferences?.units || "lbs";

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={favoriteExercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <FavoriteItem
            exercise={item}
            history={exerciseHistory[item.id]}
            units={units}
            onRemove={() => handleRemoveFavorite(item.id)}
            index={index}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            image={emptyFavoritesImage}
            title="No Favorites Yet"
            subtitle="Star exercises while logging to add them here for quick access"
          />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  favoriteItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  favoriteInfo: {
    flex: 1,
  },
  prBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  removeButton: {
    padding: Spacing.sm,
  },
});
