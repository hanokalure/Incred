import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import BrandHeader from "./BrandHeader";

export default function PageCard({ children, scroll = true, contentStyle, cardStyle, hideHeader = true }) {
    const Container = scroll ? ScrollView : View;
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
            <View style={styles.headerWrap}>
                {hideHeader ? null : <BrandHeader />}
            </View>
            <Container
                style={styles.innerContainer}
                contentContainerStyle={[
                    scroll ? styles.scrollContent : null,
                    contentStyle,
                    { paddingBottom: insets.bottom + spacing.xl }
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.card, cardStyle]}>
                    {children}
                </View>
            </Container>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    innerContainer: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    card: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
    headerWrap: { paddingHorizontal: spacing.lg }
});
