import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { toggleLanguage } from "../store/slices/langSlice";
import { fetchNotifications } from "../store/slices/notificationsSlice";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function BrandHeader() {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { isAuthenticated } = useSelector((state) => state.auth);
    const { unreadCount } = useSelector((state) => state.notifications);
    const language = useSelector((state) => state.lang.language);
    const [locationName, setLocationName] = useState("Detecting...");

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchNotifications());
        }
    }, [dispatch, isAuthenticated]);

    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setLocationName("Karnataka, IN");
                    return;
                }

                const provider = await Location.getProviderStatusAsync();
                if (!provider.locationServicesEnabled) {
                    setLocationName("Karnataka, IN");
                    return;
                }

                let location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                let reverse = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });

                if (reverse && reverse[0]) {
                    const city = reverse[0].city || reverse[0].district || reverse[0].subregion;
                    setLocationName(city ? `${city}, Karnataka` : "Karnataka, IN");
                }
            } catch (e) {
                setLocationName("Karnataka, IN");
            }
        })();
    }, []);

    return (
        <View style={styles.header}>
            <View style={styles.left}>
                <View style={styles.brandWrap}>
                    <Text style={styles.brand}>Incredible</Text>
                    <Text style={styles.brandSubtitle}>Karnataka</Text>
                </View>
                <View style={styles.locWrap}>
                    <Text style={styles.locIcon}>📍</Text>
                    <Text style={styles.locText} numberOfLines={1}>{locationName}</Text>
                </View>
            </View>

            <View style={styles.rightActions}>
                {isAuthenticated && (
                    <Pressable
                        onPress={() => navigation.navigate("Notifications", { title: "Notifications" })}
                        style={styles.bellBtn}
                    >
                        <Text style={styles.actionIcon}>🔔</Text>
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </Text>
                            </View>
                        )}
                    </Pressable>
                )}

                <Pressable
                    onPress={() => dispatch(toggleLanguage())}
                    style={styles.langToggle}
                >
                    <Text style={styles.langText}>
                        {language === "en" ? "KN" : "EN"}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: spacing.lg,
        backgroundColor: colors.background,
    },
    left: {
        flex: 1,
    },
    brandWrap: {
        gap: -6,
        marginBottom: 2,
    },
    brand: {
        fontSize: 24,
        fontWeight: "900",
        color: colors.primary,
        letterSpacing: -1,
    },
    brandSubtitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.text,
        letterSpacing: 0.5,
    },
    locWrap: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
    },
    locIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    locText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.textSecondary,
        maxWidth: "80%",
    },
    rightActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    bellBtn: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    badge: {
        position: "absolute",
        top: 4,
        right: 4,
        backgroundColor: colors.error || "#FF3B30",
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: colors.background,
    },
    badgeText: {
        color: "#FFF",
        fontSize: 10,
        fontWeight: "900",
    },
    actionIcon: {
        fontSize: 18,
    },
    langToggle: {
        backgroundColor: colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        ...Platform.select({
            ios: {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    langText: {
        fontSize: 13,
        fontWeight: "800",
        color: colors.primary,
    },
});
