import { FontAwesome } from "@expo/vector-icons";
import { useState } from "react";
import { View } from "react-native";
import { Button, Menu, useTheme } from "react-native-paper";

export interface MenuItem {
    title: string;
    leadingIcon?: string;
    onPress: () => void;
}

export function MenuFunction({ items, children }: { items?: MenuItem[]; children?: MenuItem[] }) {
    const [visible, setVisible] = useState(false);
    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);
    const color = useTheme().colors.onBackground;
    const menuItems = items ?? children ?? [];
    return (
        <View
            style={{
            }}>
            <Menu
                visible={visible}
                onDismiss={closeMenu}
                anchorPosition="bottom"
                anchor={<Button onPress={openMenu}><FontAwesome name="ellipsis-v" size={18} style={{ color }}></FontAwesome ></Button>}>
                {menuItems.map((item, index) => (
                    <Menu.Item key={index} onPress={() => {
                        item.onPress(); closeMenu();
                    }} title={item.title} leadingIcon={item.leadingIcon} />
                ))}
            </Menu>
        </View>
    );
}

// Default export to satisfy Expo Router
export default MenuFunction;
