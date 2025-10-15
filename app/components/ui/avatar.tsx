import { useMemo } from "react";
import { Image, ImageProps, Text, View } from "react-native";
import { useAppTheme } from "@/app/providers/theme-provider";
import { cn } from "@/app/lib/cn";

interface AvatarProps extends ImageProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name, size = 48, className, style, source, ...imageProps }: AvatarProps & { className?: string }) {
  const { colors, radius } = useAppTheme();
  const initials = useMemo(() => {
    if (!name) return "";
    return name
      .split(" ")
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
  }, [name]);

  const resolvedSource = uri ? { uri } : source;

  if (resolvedSource) {
    return (
      <Image
        source={resolvedSource}
        {...imageProps}
        className={cn("overflow-hidden", className)}
        style={[{ width: size, height: size, borderRadius: radius.lg }, style]}
      />
    );
  }

  return (
    <View
      className={cn("items-center justify-center", className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius.lg,
        backgroundColor: colors.accentMuted,
      }}
    >
      <Text style={{ color: colors.accent, fontWeight: "600" }}>{initials || "?"}</Text>
    </View>
  );
}
