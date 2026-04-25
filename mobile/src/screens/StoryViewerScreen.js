import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppVideo from "../components/AppVideo";
import { toDisplayMediaUrl } from "../services/mediaUrl";
import { deleteStory, recordStoryView, reportStory, setStoryHighlight } from "../services/storiesApi";
import { getAuthProfile } from "../services/authStore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STORY_DURATION_MS = 5000;

export default function StoryViewerScreen({ navigation, route }) {
  const stories = route?.params?.stories || [];
  const userName = route?.params?.userName || "Story";
  const initialIndex = Number(route?.params?.initialIndex || 0);

  const [index, setIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [showViews, setShowViews] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressAnimRef = useRef(null);
  const isPausedRef = useRef(false);

  const story = stories[index];
  const isOwnStory = useMemo(() => !!story && story.user_id === currentUserId, [story, currentUserId]);
  const isVideo = story?.media_type === "video";

  const safeGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("MainTabs");
    }
  }, [navigation]);

  useEffect(() => {
    getAuthProfile()
      .then((p) => setCurrentUserId(p?.id || null))
      .catch(() => setCurrentUserId(null));
  }, []);

  useEffect(() => {
    if (!story?.id || isOwnStory) return;
    recordStoryView(story.id).catch(() => {});
  }, [story?.id, isOwnStory]);

  useEffect(() => {
    setLoadingMedia(true);
    setActionError("");
  }, [index]);

  const startProgress = useCallback(() => {
    progressAnim.setValue(0);
    progressAnimRef.current?.stop();
    progressAnimRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION_MS,
      useNativeDriver: false,
    });
    progressAnimRef.current.start(({ finished }) => {
      if (finished && !isPausedRef.current) goNext();
    });
  }, [index]);

  useEffect(() => {
    if (isVideo || loadingMedia) {
      progressAnim.setValue(0);
      progressAnimRef.current?.stop();
      return;
    }
    if (!paused) startProgress();
    return () => progressAnimRef.current?.stop();
  }, [index, paused, loadingMedia, isVideo]);

  useEffect(() => {
    isPausedRef.current = paused;
    if (paused) {
      progressAnimRef.current?.stop();
    } else if (!isVideo && !loadingMedia) {
      startProgress();
    }
  }, [paused]);

  const goNext = useCallback(() => {
    if (index >= stories.length - 1) {
      safeGoBack();
    } else {
      setIndex((v) => v + 1);
    }
  }, [index, stories.length, safeGoBack]);

  const goPrev = useCallback(() => {
    if (index <= 0) {
      safeGoBack();
    } else {
      setIndex((v) => v - 1);
    }
  }, [index, safeGoBack]);

  const handleLongPressIn = () => setPaused(true);
  const handleLongPressOut = () => setPaused(false);

  const handleDelete = () => {
    Alert.alert("Delete Story", "Delete this story permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteStory(story.id);
            safeGoBack();
          } catch (err) {
            setActionError(err?.message || "Delete failed");
          }
        },
      },
    ]);
  };

  const handleReport = () => {
    Alert.alert("Report Story", "Report this story as inappropriate?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Report",
        style: "destructive",
        onPress: async () => {
          try {
            await reportStory(story.id, "Inappropriate story");
            Alert.alert("Reported", "Thanks for keeping the community safe.");
          } catch (err) {
            setActionError(err?.message || "Report failed");
          }
        },
      },
    ]);
  };

  const handleHighlight = async () => {
    try {
      await setStoryHighlight(story.id, !story.is_highlighted);
      safeGoBack();
    } catch (err) {
      setActionError(err?.message || "Story update failed");
    }
  };

  if (!story) {
    safeGoBack();
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" hidden />

      {/* ─── Full-screen media background ─── */}
      {isVideo ? (
        <AppVideo
          source={{ uri: toDisplayMediaUrl(story.media_url) }}
          style={styles.media}
          contentFit="cover"
          autoPlay
          nativeControls={false}
          onLoad={() => setLoadingMedia(false)}
        />
      ) : (
        <Image
          source={{ uri: toDisplayMediaUrl(story.media_url) }}
          style={styles.media}
          resizeMode="cover"
          onLoad={() => setLoadingMedia(false)}
          onError={() => setLoadingMedia(false)}
        />
      )}

      {/* Loading shimmer */}
      {loadingMedia && <View style={styles.loadingOverlay} pointerEvents="none" />}

      {/* ─── Single full-screen tap handler ─── */}
      <TouchableWithoutFeedback
        onPress={(e) => {
          const x = e.nativeEvent.locationX;
          if (x < SCREEN_WIDTH * 0.4) goPrev();
          else goNext();
        }}
        onLongPress={handleLongPressIn}
        onPressOut={handleLongPressOut}
        delayLongPress={200}
      >
        <View style={styles.touchLayer} />
      </TouchableWithoutFeedback>

      {/* ─── UI Overlay — pointerEvents=box-none so touches pass to the gesture layer below ─── */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">

        {/* TOP: Progress bars + header */}
        <View style={styles.topBar} pointerEvents="box-none">
          <View style={styles.progressRow} pointerEvents="none">
            {stories.map((item, i) => (
              <View key={item.id || i} style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width:
                        i < index
                          ? "100%"
                          : i === index && !isVideo
                          ? progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0%", "100%"],
                            })
                          : "0%",
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          <View style={styles.header} pointerEvents="box-none">
            <View style={styles.userInfo} pointerEvents="none">
              <View style={styles.avatar}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>
              <Text style={styles.userName}>{userName}</Text>
            </View>

            <View style={styles.headerActions}>
              {/* Eye icon — view count */}
              {isOwnStory && (
                <TouchableOpacity onPress={() => setShowViews(true)} style={styles.iconBtn}>
                  <Ionicons name="eye-outline" size={22} color="#fff" />
                  {(story.view_count ?? 0) > 0 && (
                    <Text style={styles.viewBadge}>{story.view_count}</Text>
                  )}
                </TouchableOpacity>
              )}

              {isOwnStory ? (
                <>
                  <TouchableOpacity onPress={handleHighlight} style={styles.iconBtn}>
                    <Ionicons
                      name={story.is_highlighted ? "star" : "star-outline"}
                      size={21}
                      color={story.is_highlighted ? "#FFD700" : "#fff"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={21} color="#FF6B6B" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={handleReport} style={styles.iconBtn}>
                  <Ionicons name="flag-outline" size={21} color="#fff" />
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={safeGoBack} style={styles.iconBtn}>
                <Ionicons name="close" size={25} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* BOTTOM: Caption + Add story */}
        <View style={styles.bottomBar} pointerEvents="box-none">
          {actionError ? (
            <View style={styles.errorBanner} pointerEvents="none">
              <Ionicons name="alert-circle-outline" size={14} color="#fff" />
              <Text style={styles.errorText}>{actionError}</Text>
            </View>
          ) : null}

          {story.caption ? (
            <Text style={styles.caption} pointerEvents="none">{story.caption}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.addStoryBtn}
            onPress={() => navigation.navigate("CreateStory")}
          >
            <Ionicons name="add-circle-outline" size={17} color="#fff" />
            <Text style={styles.addStoryText}>Add your story</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ─── Views Modal ─── */}
      <Modal
        visible={showViews}
        transparent
        animationType="slide"
        onRequestClose={() => setShowViews(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowViews(false)}>
          <View style={styles.viewsSheet}>
            <View style={styles.viewsHandle} />
            <View style={styles.viewsHeader}>
              <Ionicons name="eye" size={18} color="#fff" />
              <Text style={styles.viewsTitle}>
                {story.view_count ?? 0} View{(story.view_count ?? 0) !== 1 ? "s" : ""}
              </Text>
            </View>
            {story.viewer_names?.length ? (
              story.viewer_names.map((name, i) => (
                <View key={i} style={styles.viewerRow}>
                  <View style={styles.viewerAvatar}>
                    <Ionicons name="person" size={14} color="#aaa" />
                  </View>
                  <Text style={styles.viewerName}>{name}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noViewers}>No viewers yet</Text>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  media: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingOverlay: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#111",
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: "transparent",
    // Simulated gradient with opacity layers
    borderTopWidth: 0,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: "transparent",
  },

  // Touch layer — full screen, below UI overlay
  touchLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },

  // Overlay
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
  },

  // TOP BAR
  topBar: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 12,
    // No backgroundColor — transparent so touches fall through to gesture layer
    zIndex: 10,
  },
  progressRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 10,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 999,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  userName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    position: "relative",
  },
  viewBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#fff",
    color: "#000",
    fontSize: 9,
    fontWeight: "900",
    borderRadius: 8,
    minWidth: 14,
    paddingHorizontal: 2,
    textAlign: "center",
    overflow: "hidden",
  },

  // BOTTOM BAR
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 16,
    gap: 10,
    // No backgroundColor — transparent so touches fall through to gesture layer
    zIndex: 10,
  },
  caption: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  addStoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  addStoryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(220,50,50,0.85)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  // Views Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  viewsSheet: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  viewsHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#444",
    alignSelf: "center",
    marginBottom: 16,
  },
  viewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  viewsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  viewerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  viewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerName: {
    color: "#ddd",
    fontSize: 14,
    fontWeight: "500",
  },
  noViewers: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginTop: 24,
  },
});
