import { Material3Theme } from "@pchmn/expo-material3-theme";
import { useState } from "react";
import { ColorSchemeName } from "react-native";
import { Button, List, MD3DarkTheme, MD3LightTheme, RadioButton, useTheme } from "react-native-paper";
import { UserPreferences, ThemeOptions } from "../userpref";
import { Colors } from "@/constants/Colors";

export const ThemeSelectionAccordion = ({ userPref, setUserPref, setSnackbarText }: {
    userPref: UserPreferences, setUserPref: (userPref: UserPreferences) => void,
    setSnackbarText: (text: string) => void
}) => {
    const { colors } = useTheme();
    const [expanded, setExpanded] = useState(true);
    const [theme, setTheme] = useState(userPref.theme);
    const handlePress = () => setExpanded(!expanded);

    const handleThemeChange = (value: ThemeOptions) => {
        setTheme(value);
    };
    const handleApplyTheme = () => {
        const newUserPref = { ...userPref, theme };
        setUserPref(newUserPref);
        setSnackbarText('Theme applied successfully');
    }
    return (

        <List.Accordion
            title="Select Theme"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            expanded={expanded}
            onPress={handlePress}
            titleStyle={{ color: colors.primary }}
        >
            <RadioButton.Group
                onValueChange={(newValue) => handleThemeChange(newValue as ThemeOptions)}
                value={theme}
            >
                <List.Item
                    title="System Theme"
                    onPress={() => handleThemeChange(ThemeOptions.System)}
                    left={(props) => <List.Icon {...props} icon="white-balance-auto" />}
                    right={() => <RadioButton value={ThemeOptions.System} />}
                />
                <List.Item
                    title="Light Theme"
                    onPress={() => handleThemeChange(ThemeOptions.Light)}
                    left={(props) => <List.Icon {...props} icon="white-balance-sunny" />}
                    right={() => <RadioButton value={ThemeOptions.Light} />}
                />
                <List.Item
                    title="Dark Theme"
                    onPress={() => handleThemeChange(ThemeOptions.Dark)}
                    left={(props) => <List.Icon {...props} icon="weather-night" />}
                    right={() => <RadioButton value={ThemeOptions.Dark} />}
                />
            </RadioButton.Group>
            <Button
                mode="contained"
                onPress={handleApplyTheme}
                style={{ margin: 10 }}
            >
                Apply Theme
            </Button>
        </List.Accordion>
    );
};

export function getTheme({ colorScheme, themeOptions, theme }: {
    colorScheme: ColorSchemeName,
    themeOptions: ThemeOptions, theme: Material3Theme
}) {
    const darkTheme = { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, ...theme.dark, ...Colors.dark } };
    const lightTheme = { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, ...theme.light, ...Colors.light } };
    if (themeOptions === ThemeOptions.System) {
        const paperTheme =
            colorScheme === 'dark'
                ? darkTheme
                : lightTheme;
        return paperTheme;
    } else {
        const paperTheme =
            themeOptions === ThemeOptions.Dark
                ? darkTheme
                : lightTheme;
        return paperTheme;
    }
}

export default function ThemeSettingsRoute() {
    return null;
}

