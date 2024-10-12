import { Material3Theme, useMaterial3Theme } from "@pchmn/expo-material3-theme";
import { useEffect, useState } from "react";
import { View, StyleSheet, Text, ColorSchemeName, useColorScheme } from "react-native";
import { Button, List, MD3DarkTheme, MD3LightTheme, PaperProvider, RadioButton, Snackbar, useTheme } from "react-native-paper";
import { getUserPreference, setUserPreference, userPrefStore } from "../storage";
import { UserPreferences, ThemeOptions } from "./types";

export const ThemeSelectionAccordion = ({ userPref, setUserPref }: {
    userPref: UserPreferences, setUserPref: (userPref: UserPreferences) => void
}) => {
    const { colors } = useTheme();
    const [expanded, setExpanded] = useState(true);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [theme, setTheme] = useState(userPref.theme);
    const handlePress = () => setExpanded(!expanded);

    const handleThemeChange = (value: ThemeOptions) => {
        setTheme(value);
    };
    const handleApplyTheme = () => {
        const newUserPref = { ...userPref, theme };
        setUserPref(newUserPref);
        setUserPreference(newUserPref);
        setSnackbarVisible(true);
    }
    return (
        <View style={[styles.container]}>
            <List.Section>
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
                        children="Apply Theme"
                    />
                </List.Accordion>
            </List.Section>
            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                action={{
                    label: 'Dismiss',
                    onPress: () => setSnackbarVisible(false),
                }} children={`Theme applied successfully`}
            />
        </View>
    );
};

export function getTheme({ colorScheme, themeOptions, theme }: {
    colorScheme: ColorSchemeName,
    themeOptions: ThemeOptions, theme: Material3Theme
}) {
    const darkTheme = { ...MD3DarkTheme, colors: theme.dark };
    const lightTheme = { ...MD3LightTheme, colors: theme.light };
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 0,
    },
    text: {
        fontSize: 20,
    },
});