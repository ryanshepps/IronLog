import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { UserPreferences, DEFAULT_PREFERENCES } from "@/types/workout";
import { getPreferences, savePreferences, getWorkouts } from "@/lib/storage";

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText
        type="caption"
        style={[styles.sectionTitle, { color: theme.textSecondary }]}
      >
        {title}
      </ThemedText>
      <View
        style={[styles.sectionContent, { backgroundColor: theme.backgroundSecondary }]}
      >
        {children}
      </View>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
  showChevron = true,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        { opacity: pressed && onPress ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
        <Feather name={icon} size={16} color="#FFFFFF" />
      </View>
      <ThemedText type="body" style={styles.rowLabel}>
        {label}
      </ThemedText>
      {rightElement ? (
        rightElement
      ) : (
        <>
          {value ? (
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {value}
            </ThemedText>
          ) : null}
          {showChevron && onPress ? (
            <Feather
              name="chevron-right"
              size={20}
              color={theme.textSecondary}
              style={{ marginLeft: Spacing.sm }}
            />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

function Divider() {
  const { theme } = useTheme();
  return (
    <View
      style={[styles.divider, { backgroundColor: theme.border, marginLeft: 52 }]}
    />
  );
}

export default function ProfileScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const [preferences, setPreferences] = useState<UserPreferences>(
    DEFAULT_PREFERENCES
  );
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalSets: 0,
    totalExercises: 0,
  });

  const loadData = useCallback(async () => {
    const [prefs, workouts] = await Promise.all([getPreferences(), getWorkouts()]);
    setPreferences(prefs);

    const totalSets = workouts.reduce(
      (acc, w) => acc + w.exercises.reduce((a, e) => a + e.sets.length, 0),
      0
    );
    const totalExercises = workouts.reduce(
      (acc, w) => acc + w.exercises.length,
      0
    );

    setStats({
      totalWorkouts: workouts.length,
      totalSets,
      totalExercises,
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleUnits = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newUnits = preferences.units === "lbs" ? "kg" : "lbs";
    setPreferences((prev) => ({ ...prev, units: newUnits }));
    await savePreferences({ units: newUnits });
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.profileHeader}>
          <View
            style={[styles.avatar, { backgroundColor: theme.primary + "20" }]}
          >
            <Feather name="user" size={40} color={theme.primary} />
          </View>
          <ThemedText type="h2" style={styles.displayName}>
            {preferences.displayName}
          </ThemedText>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="h2" style={{ color: theme.primary }}>
              {stats.totalWorkouts}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Workouts
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="h2" style={{ color: theme.primary }}>
              {stats.totalSets}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Sets
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="h2" style={{ color: theme.primary }}>
              {stats.totalExercises}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Exercises
            </ThemedText>
          </View>
        </View>

        <SettingsSection title="PREFERENCES">
          <SettingsRow
            icon="sliders"
            label="Weight Units"
            rightElement={
              <Pressable
                onPress={handleToggleUnits}
                style={[
                  styles.unitToggle,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <View
                  style={[
                    styles.unitOption,
                    preferences.units === "lbs" && {
                      backgroundColor: theme.primary,
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: preferences.units === "lbs" ? "#FFFFFF" : theme.text,
                      fontWeight: "600",
                    }}
                  >
                    lbs
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.unitOption,
                    preferences.units === "kg" && {
                      backgroundColor: theme.primary,
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: preferences.units === "kg" ? "#FFFFFF" : theme.text,
                      fontWeight: "600",
                    }}
                  >
                    kg
                  </ThemedText>
                </View>
              </Pressable>
            }
            showChevron={false}
          />
        </SettingsSection>

        <SettingsSection title="ABOUT">
          <SettingsRow
            icon="info"
            label="Version"
            value="1.0.0"
            showChevron={false}
          />
        </SettingsSection>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  displayName: {
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    minHeight: 52,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  rowLabel: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  unitToggle: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  unitOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
