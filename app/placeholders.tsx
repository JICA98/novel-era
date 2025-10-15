import { Image, View, Text } from "react-native";
import { Button, Card } from "@/app/components/ui";
import { useAppTheme } from "@/app/providers/theme-provider";

export function EmptyFavoritePlaceholder() {
    const { colors } = useAppTheme();
    return (
        <Card elevated className="mx-6 mt-32 items-center">
            <Image
                source={require("../assets/images/box.png")}
                style={{ width: 180, height: 140, resizeMode: "contain" }}
            />
            <Text style={{ color: colors.text, textAlign: "center", fontSize: 16, marginTop: 16 }}>
                Nothing found in favorites. Try refreshing or adding to your library.
            </Text>
        </Card>
    );
}

export function EmptyPlaceholder({ message }: { message: string }) {
    const { colors } = useAppTheme();
    return (
        <View className="items-center px-8 pt-16">
            <Image
                source={require("../assets/images/inbox.png")}
                style={{ width: 180, height: 140, resizeMode: "contain" }}
            />
            <Text style={{ color: colors.text, textAlign: "center", fontSize: 16, marginTop: 16 }}>
                {message}
            </Text>
        </View>
    );
}

export function ErrorPlaceholder({ message, onRetry }: { message?: string; onRetry?: () => void }) {
    const { colors } = useAppTheme();
    return (
        <View className="items-center px-8 pt-20">
            <Image
                source={require("../assets/images/no-comment.png")}
                style={{ width: 180, height: 140, resizeMode: "contain" }}
            />
            <Text style={{ color: colors.text, textAlign: "center", fontSize: 16, marginTop: 16 }}>
                {message ?? "Something went wrong. Try again?"}
            </Text>
            {onRetry && (
                <Button className="mt-6" onPress={onRetry}>
                    Retry
                </Button>
            )}
        </View>
    );
}