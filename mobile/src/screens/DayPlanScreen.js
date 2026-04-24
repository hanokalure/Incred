import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "../components/ScreenHeader";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// ─── Color palette for consistency ──────────────────────────────────────────
const ACTIVITY_ICONS = {
  restaurant:       { icon: "restaurant-outline", bg: "#FEF5E7", color: "#D35400" },
  stay:             { icon: "bed-outline", bg: "#EBF5FB", color: "#2980B9" },
  temple:           { icon: "star-outline", bg: "#F5EEF8", color: "#8E44AD" },
  nature:           { icon: "leaf-outline", bg: "#EAFAF1", color: "#27AE60" },
  history:          { icon: "trail-sign-outline", bg: "#FDECEA", color: "#C0392B" },
  default:          { icon: "location-outline", bg: "#F2F3F4", color: "#566573" },
};

function getActivityMeta(category) {
  const cat = String(category || "").toLowerCase();
  if (cat.includes("food") || cat.includes("restaurant")) return ACTIVITY_ICONS.restaurant;
  if (cat.includes("stay") || cat.includes("hotel")) return ACTIVITY_ICONS.stay;
  if (cat.includes("temple")) return ACTIVITY_ICONS.temple;
  if (cat.includes("nature") || cat.includes("lake") || cat.includes("waterfall")) return ACTIVITY_ICONS.nature;
  if (cat.includes("fort") || cat.includes("history")) return ACTIVITY_ICONS.history;
  return ACTIVITY_ICONS.default;
}

// ─── Timeline Item Component ────────────────────────────────────────────────
function TimelineItem({ time, title, category, isLast }) {
  const meta = getActivityMeta(category);
  
  return (
    <View style={styles.timelineRow}>
      {/* Left Axis */}
      <View style={styles.axis}>
        <View style={[styles.dot, { backgroundColor: meta.color }]} />
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Right Content */}
      <View style={styles.activityCard}>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: meta.color }]}>{time}</Text>
          <View style={[styles.typePill, { backgroundColor: meta.bg }]}>
            <Text style={[styles.typeText, { color: meta.color }]}>{category}</Text>
          </View>
        </View>
        <Text style={styles.activityTitle}>{title}</Text>
      </View>
    </View>
  );
}

export default function DayPlanScreen({ navigation, route }) {
  const plan = route?.params?.plan || null;
  const dayKeys = plan ? Object.keys(plan) : ["Day 1"];

  // Mock data if plan is empty (for demo/fallback)
  const defaultItems = [
    { time: "09:00 AM", title: "Temple Visit", cat: "Temple" },
    { time: "11:30 AM", title: "Local Karnataka Breakfast", cat: "Restaurant" },
    { time: "02:00 PM", title: "Hidden Serene Lake", cat: "Nature" },
    { time: "04:30 PM", title: "Chitradurga Historical Fort", cat: "History" },
  ];

  return (
    <PageCard>
      <ScreenHeader title="Your Itinerary" onBack={() => navigation.goBack()} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.introBox}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={styles.aiText}>AI CURATED</Text>
          </View>
          <Text style={styles.introTitle}>Personalized Travel Plan</Text>
          <Text style={styles.introDesc}>We've optimized your route for the best experience across Karnataka.</Text>
        </View>

        {dayKeys.length === 0 || !plan ? (
          <View style={styles.dayGroup}>
            <Text style={styles.groupLabel}>DAY 1</Text>
            <View style={styles.groupCard}>
              {defaultItems.map((item, idx) => (
                <TimelineItem 
                  key={idx}
                  time={item.time}
                  title={item.title}
                  category={item.cat}
                  isLast={idx === defaultItems.length - 1}
                />
              ))}
            </View>
          </View>
        ) : (
          dayKeys.map((day, dIdx) => (
            <View key={day} style={styles.dayGroup}>
              <Text style={styles.groupLabel}>{day.toUpperCase()}</Text>
              <View style={styles.groupCard}>
                {plan[day].map((item, iIdx) => (
                  <TimelineItem 
                    key={item.id || iIdx}
                    time={item.time || "—"}
                    title={item.name}
                    category={item.category || "Activity"}
                    isLast={iIdx === plan[day].length - 1}
                  />
                ))}
              </View>
            </View>
          ))
        )}

        <View style={styles.footer}>
          <Pressable style={styles.saveBtn}>
            <Ionicons name="download-outline" size={20} color={colors.text} />
            <Text style={styles.saveBtnText}>Save Itinerary</Text>
          </Pressable>
        </View>
      </ScrollView>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40,
  },
  introBox: {
    paddingVertical: spacing.lg,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  aiText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1,
  },
  introTitle: {
    ...typography.h2,
    fontSize: 24,
    color: colors.text,
  },
  introDesc: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  
  dayGroup: {
    marginBottom: spacing.xl,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  timelineRow: {
    flexDirection: "row",
    minHeight: 80,
  },
  axis: {
    width: 20,
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 24,
    zIndex: 2,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  line: {
    position: "absolute",
    top: 30,
    bottom: 0,
    width: 2,
    backgroundColor: colors.border,
  },
  
  activityCard: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },

  footer: {
    marginTop: spacing.md,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 16,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
});
