import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Modal, Pressable, ScrollView, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import Animated, { FadeIn } from "react-native-reanimated";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { FeelingDots } from "@/components/FeelingRating";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ExercisePerformanceEntry, getExercisePerformanceHistory } from "@/lib/storage";

interface ExerciseHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
  units: "kg" | "lbs";
}

const CHART_HEIGHT = 160;
const CHART_PADDING = 40;

function ProgressChart({
  data,
  units,
}: {
  data: ExercisePerformanceEntry[];
  units: "kg" | "lbs";
}) {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - Spacing.xl * 2 - Spacing.lg * 2;

  if (data.length < 2) {
    return (
      <View style={[styles.chartPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="trending-up" size={32} color={theme.textSecondary} />
        <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
          Log more sessions to see your progress
        </ThemedText>
      </View>
    );
  }

  // Reverse so oldest is first for chart
  const chartData = [...data].reverse().slice(-10);
  
  const weights = chartData.map(d => d.bestWeight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 10;
  const paddedMin = minWeight - weightRange * 0.1;
  const paddedMax = maxWeight + weightRange * 0.1;

  const volumes = chartData.map(d => d.totalVolume);
  const minVolume = Math.min(...volumes);
  const maxVolume = Math.max(...volumes);
  const volumeRange = maxVolume - minVolume || 1;
  const paddedVolMin = minVolume - volumeRange * 0.1;
  const paddedVolMax = maxVolume + volumeRange * 0.1;

  const getX = (index: number) => {
    const usableWidth = chartWidth - CHART_PADDING * 2;
    return CHART_PADDING + (index / (chartData.length - 1)) * usableWidth;
  };

  const getY = (weight: number) => {
    const usableHeight = CHART_HEIGHT - CHART_PADDING;
    const normalized = (weight - paddedMin) / (paddedMax - paddedMin);
    return CHART_HEIGHT - CHART_PADDING / 2 - normalized * usableHeight;
  };

  const getVolumeY = (volume: number) => {
    const usableHeight = CHART_HEIGHT - CHART_PADDING;
    const normalized = (volume - paddedVolMin) / (paddedVolMax - paddedVolMin);
    return CHART_HEIGHT - CHART_PADDING / 2 - normalized * usableHeight;
  };

  // Create path using best weight per session
  let pathD = "";
  let volumePathD = "";
  chartData.forEach((entry, index) => {
    const x = getX(index);
    const y = getY(entry.bestWeight);
    const vy = getVolumeY(entry.totalVolume);
    if (index === 0) {
      pathD += `M ${x} ${y}`;
      volumePathD += `M ${x} ${vy}`;
    } else {
      pathD += ` L ${x} ${y}`;
      volumePathD += ` L ${x} ${vy}`;
    }
  });

  // Calculate trend
  const firstWeight = chartData[0].bestWeight;
  const lastWeight = chartData[chartData.length - 1].bestWeight;
  const trend = lastWeight - firstWeight;
  const trendPercent = firstWeight > 0 ? ((trend / firstWeight) * 100).toFixed(1) : "0";

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md, flexWrap: "wrap" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 2, backgroundColor: theme.primary }} />
            <ThemedText type="small" style={{ color: theme.textSecondary, fontWeight: "600" }}>
              Weight
            </ThemedText>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 2, backgroundColor: theme.feelingEasy }} />
            <ThemedText type="small" style={{ color: theme.textSecondary, fontWeight: "600" }}>
              Volume
            </ThemedText>
          </View>
        </View>
        <View style={[
          styles.trendBadge,
          { backgroundColor: trend >= 0 ? theme.feelingEasy + "20" : theme.error + "20" }
        ]}>
          <Feather
            name={trend >= 0 ? "trending-up" : "trending-down"}
            size={14}
            color={trend >= 0 ? theme.feelingEasy : theme.error}
          />
          <ThemedText
            type="small"
            style={{ color: trend >= 0 ? theme.feelingEasy : theme.error, fontWeight: "600" }}
          >
            {trend >= 0 ? "+" : ""}{trendPercent}%
          </ThemedText>
        </View>
      </View>
      
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        {/* Y-axis labels */}
        <SvgText
          x={8}
          y={CHART_PADDING / 2 + 4}
          fill={theme.textSecondary}
          fontSize={10}
        >
          {Math.round(paddedMax)}{units}
        </SvgText>
        <SvgText
          x={8}
          y={CHART_HEIGHT - 4}
          fill={theme.textSecondary}
          fontSize={10}
        >
          {Math.round(paddedMin)}{units}
        </SvgText>

        {/* Grid lines */}
        <Line
          x1={CHART_PADDING}
          y1={CHART_PADDING / 2}
          x2={chartWidth - CHART_PADDING / 2}
          y2={CHART_PADDING / 2}
          stroke={theme.textSecondary}
          strokeWidth={0.5}
          strokeDasharray="4,4"
          opacity={0.3}
        />
        <Line
          x1={CHART_PADDING}
          y1={CHART_HEIGHT - CHART_PADDING / 2}
          x2={chartWidth - CHART_PADDING / 2}
          y2={CHART_HEIGHT - CHART_PADDING / 2}
          stroke={theme.textSecondary}
          strokeWidth={0.5}
          strokeDasharray="4,4"
          opacity={0.3}
        />

        {/* Volume line */}
        <Path
          d={volumePathD}
          fill="none"
          stroke={theme.feelingEasy}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="5,3"
          opacity={0.8}
        />

        {/* Weight line */}
        <Path
          d={pathD}
          fill="none"
          stroke={theme.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Volume points */}
        {chartData.map((entry, index) => (
          <Circle
            key={`vol-${index}`}
            cx={getX(index)}
            cy={getVolumeY(entry.totalVolume)}
            r={3}
            fill={theme.feelingEasy}
            stroke={theme.backgroundDefault}
            strokeWidth={1.5}
          />
        ))}

        {/* Weight points */}
        {chartData.map((entry, index) => (
          <Circle
            key={index}
            cx={getX(index)}
            cy={getY(entry.bestWeight)}
            r={5}
            fill={theme.primary}
            stroke={theme.backgroundDefault}
            strokeWidth={2}
          />
        ))}
      </Svg>
    </View>
  );
}

function HistoryEntry({
  entry,
  units,
  index,
  isLatest,
}: {
  entry: ExercisePerformanceEntry;
  units: "kg" | "lbs";
  index: number;
  isLatest: boolean;
}) {
  const { theme } = useTheme();
  const date = new Date(entry.date);

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(200)}
      style={[
        styles.historyEntry,
        { backgroundColor: theme.backgroundSecondary },
        isLatest && { borderColor: theme.primary, borderWidth: 2 },
      ]}
    >
      <View style={styles.entryHeader}>
        <View style={styles.entryHeaderLeft}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </ThemedText>
          {isLatest ? (
            <View style={[styles.latestBadge, { backgroundColor: theme.primary + "20" }]}>
              <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                Latest
              </ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {entry.sets.length} {entry.sets.length === 1 ? "set" : "sets"} · {entry.totalVolume.toLocaleString()} vol
        </ThemedText>
      </View>

      <View style={styles.setsTable}>
        <View style={styles.setsTableHeader}>
          <ThemedText type="small" style={[styles.setColumn, { color: theme.textSecondary }]}>
            Set
          </ThemedText>
          <ThemedText type="small" style={[styles.weightColumn, { color: theme.textSecondary }]}>
            Weight
          </ThemedText>
          <ThemedText type="small" style={[styles.repsColumn, { color: theme.textSecondary }]}>
            Reps
          </ThemedText>
          <ThemedText type="small" style={[styles.feelingColumn, { color: theme.textSecondary }]}>
            RPE
          </ThemedText>
        </View>
        {entry.sets.map((set, setIndex) => (
          <View 
            key={setIndex} 
            style={[
              styles.setRow,
              { borderTopColor: theme.textSecondary + "20" },
            ]}
          >
            <ThemedText type="body" style={[styles.setColumn, { color: theme.textSecondary }]}>
              {setIndex + 1}
            </ThemedText>
            <ThemedText type="body" style={[styles.weightColumn, { fontWeight: "600" }]}>
              {set.weight} {units}
            </ThemedText>
            <ThemedText type="body" style={styles.repsColumn}>
              {set.reps}
            </ThemedText>
            <View style={styles.feelingColumn}>
              <FeelingDots feeling={set.feeling} size="small" />
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

export function ExerciseHistoryModal({
  visible,
  onClose,
  exerciseId,
  exerciseName,
  units,
}: ExerciseHistoryModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<ExercisePerformanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const data = await getExercisePerformanceHistory(exerciseId);
    setHistory(data);
    setLoading(false);
  }, [exerciseId]);

  useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [visible, loadHistory]);

  const personalRecord = history.length > 0
    ? Math.max(...history.map(h => h.bestWeight))
    : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h4" numberOfLines={1} style={styles.headerTitle}>
            {exerciseName}
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {personalRecord > 0 ? (
            <View style={[styles.prBanner, { backgroundColor: theme.primary + "15" }]}>
              <Feather name="award" size={24} color={theme.primary} />
              <View style={styles.prContent}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Personal Record
                </ThemedText>
                <ThemedText type="h3" style={{ color: theme.primary }}>
                  {personalRecord} {units}
                </ThemedText>
              </View>
            </View>
          ) : null}

          <ProgressChart data={history} units={units} />

          <View style={styles.historySection}>
            <ThemedText
              type="small"
              style={[styles.sectionLabel, { color: theme.textSecondary }]}
            >
              Session History ({history.length} sessions)
            </ThemedText>

            {history.length === 0 ? (
              <View style={[styles.emptyHistory, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="clock" size={32} color={theme.textSecondary} />
                <ThemedText
                  type="body"
                  style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
                >
                  No history yet for this exercise
                </ThemedText>
              </View>
            ) : (
              history.map((entry, index) => (
                <HistoryEntry
                  key={entry.timestamp}
                  entry={entry}
                  units={units}
                  index={index}
                  isLatest={index === 0}
                />
              ))
            )}
          </View>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  prBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  prContent: {
    flex: 1,
  },
  chartContainer: {
    marginBottom: Spacing.xl,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  chartPlaceholder: {
    height: CHART_HEIGHT,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  historySection: {
    marginTop: Spacing.md,
  },
  sectionLabel: {
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  historyEntry: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  entryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  latestBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  setsTable: {
    marginTop: Spacing.xs,
  },
  setsTableHeader: {
    flexDirection: "row",
    paddingBottom: Spacing.xs,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  setColumn: {
    width: 36,
    textAlign: "center",
  },
  weightColumn: {
    flex: 1,
  },
  repsColumn: {
    width: 50,
    textAlign: "center",
  },
  feelingColumn: {
    width: 80,
    alignItems: "flex-end",
  },
  emptyHistory: {
    borderRadius: BorderRadius.xl,
    padding: Spacing["3xl"],
    alignItems: "center",
  },
});
