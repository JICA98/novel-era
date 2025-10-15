import { ReactNode } from "react";
import { Dimensions, Modal, Pressable, SafeAreaView, View } from "react-native";
import { MotiView } from "moti";
import { useAppTheme } from "@/app/providers/theme-provider";

interface SheetProps {
  visible: boolean;
  onDismiss?: () => void;
  children: ReactNode;
  snapPoint?: number;
}

export function Sheet({ visible, onDismiss, children, snapPoint = 0.8 }: SheetProps) {
  const { colors, radius } = useAppTheme();
  const minHeight = Dimensions.get("window").height * snapPoint;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable className="flex-1 bg-black/40" onPress={onDismiss}>
        <Pressable className="mt-auto" onPress={() => {}}>
          <MotiView
            from={{ translateY: 40, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: "timing", duration: 220 }}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              minHeight,
            }}
          >
            <SafeAreaView style={{ padding: 20 }}>{children}</SafeAreaView>
          </MotiView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
