import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { toggleLanguage } from "../store/slices/langSlice";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function BrandHeader() {
    const dispatch = useDispatch();
    const language = useSelector((state) => state.lang.language);
    const [locationName, setLocationName] = useState("Detecting...");

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
                    accuracy: Location.Accuracy.Highest,
                    mayShowUserSettingsDialog: true,
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

            <Pressable
                onPress={() => dispatch(toggleLanguage())}
                style={styles.langToggle}
            >
                <Text style={styles.langText}>
                    {language === "en" ? "KN" : "EN"}
                </Text>
            </Pressable>
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
