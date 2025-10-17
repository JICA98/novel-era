import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { ThemeSelectionAccordion } from "./themeSettings";
import { userPrefStore, getUserPreference } from "../userpref";
import Auth from "./accountSettings";
import { List, RadioButton, Snackbar, Switch, Text } from "react-native-paper";
import UseRepositoryLayout from "../_repos";
import { Repo } from "@/types";
import { useRouter } from "expo-router";


export default function Settings() {
    const userPref = userPrefStore((state: any) => state.userPref);
    const setUserPref = userPrefStore((state: any) => state.setUserPref);
    const [snackbarText, setSnackbarText] = useState('');
    const router = useRouter();
    
    useEffect(() => {
        async function fetchUserPreferences() {
            const preferences = await getUserPreference();
            setUserPref(preferences);
        }
        fetchUserPreferences();
    }, [setUserPref]);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <List.Section>
                    <Auth setSnackbarText={setSnackbarText} />
                    <List.Item
                        title="Privacy & Data Policy"
                        description="View data collection practices and manage your account"
                        left={(props) => <List.Icon {...props} icon="shield-account" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => router.push('/privacy/' as any)}
                    />
                    {userPref && (
                        <>
                            <ThemeSelectionAccordion
                                userPref={userPref}
                                setUserPref={setUserPref}
                                setSnackbarText={setSnackbarText}
                            />
                            <UseRepositoryLayout
                                props={{
                                    renderRepositories: (repos) => (
                                        <SearchPreferencesSection
                                            repos={repos}
                                            setSnackbarText={setSnackbarText}
                                        />
                                    ),
                                }}
                            />
                        </>
                    )}
                </List.Section>
            </ScrollView>
            <Snackbar
                visible={!!snackbarText.length}
                onDismiss={() => setSnackbarText('')}
                action={{
                    label: 'Dismiss',
                    onPress: () => setSnackbarText(''),
                }}
            >
                {snackbarText}
            </Snackbar>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 0,
    },
    scrollContent: {
        paddingBottom: 48,
    },
    text: {
        fontSize: 20,
    },
});

function SearchPreferencesSection({ repos, setSnackbarText }: { repos: Repo[]; setSnackbarText: (text: string) => void; }) {
    const userPref = userPrefStore((state: any) => state.userPref);
    const setDefaultUniversalSearch = userPrefStore((state: any) => state.setDefaultUniversalSearch);
    const setPreferredRepository = userPrefStore((state: any) => state.setPreferredRepository);
    const [expanded, setExpanded] = useState(false);
    const preferredRepoId = userPref?.preferredRepositoryId;
    const defaultUniversalSearch = userPref?.defaultUniversalSearch ?? false;

    const repoItems = useMemo(() => {
        return repos.map((repo) => ({ id: repo.id, name: repo.name }));
    }, [repos]);

    if (!userPref) {
        return null;
    }

    return (
        <List.Accordion
            title="Search Preferences"
            expanded={expanded}
            onPress={() => setExpanded((value) => !value)}
            left={(props) => <List.Icon {...props} icon="magnify" />}
        >
            <List.Item
                title="Enable universal search by default"
                description="Use all sources when opening search"
                right={() => (
                    <Switch
                        value={defaultUniversalSearch}
                        onValueChange={(value) => {
                            setDefaultUniversalSearch(value);
                            setSnackbarText('Universal search preference updated');
                        }}
                    />
                )}
            />
            <List.Item
                title="Preferred source"
                description={preferredRepoId ? repoItems.find((item) => item.id === preferredRepoId)?.name : 'First available'}
                right={() => (
                    <Text variant="labelMedium" style={{ alignSelf: 'center' }}>
                        {preferredRepoId ? 'Selected' : 'Auto'}
                    </Text>
                )}
            />
            <RadioButton.Group
                value={preferredRepoId ?? ''}
                onValueChange={(value) => {
                    const repoId = value || undefined;
                    setPreferredRepository(repoId);
                    setSnackbarText('Preferred source updated');
                }}
            >
                <List.Item
                    title="No preference"
                    description="Use the first available source"
                    left={(props) => <List.Icon {...props} icon="circle-outline" />}
                    right={() => <RadioButton value="" />}
                    onPress={() => {
                        setPreferredRepository(undefined);
                        setSnackbarText('Preferred source cleared');
                    }}
                />
                {repoItems.map((repo) => (
                    <List.Item
                        key={repo.id}
                        title={repo.name}
                        onPress={() => {
                            setPreferredRepository(repo.id);
                            setSnackbarText('Preferred source updated');
                        }}
                        right={() => <RadioButton value={repo.id} />}
                    />
                ))}
            </RadioButton.Group>
        </List.Accordion>
    );
}