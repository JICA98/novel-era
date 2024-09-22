import * as React from 'react';
import { BottomNavigation, Text } from 'react-native-paper';
import { create } from 'zustand'

export const indexes = {
    favorites: 0,
    search: 1,
    recents: 2,
    settings: 3
}

const MusicRoute = () => <Text>Music</Text>;

const AlbumsRoute = () => <Text>Albums</Text>;

const RecentsRoute = () => <Text>Recents</Text>;

const NotificationsRoute = () => <Text>Notifications</Text>;

export const useBottomIndexStore = create((set) => ({
    index: 0,
    setIndex: (index: number) => set({ index: index })
}))

const MyBottom = () => {
    const index = useBottomIndexStore((state: any) => state.index);
    const setIndex = useBottomIndexStore((state: any) => state.setIndex);
    const [routes] = React.useState([
        { key: 'favorites', title: 'Favorites', focusedIcon: 'heart', unfocusedIcon: 'heart-outline' },
        { key: 'search', title: 'Search', focusedIcon: 'cloud-search', unfocusedIcon: 'cloud-search-outline' },
        { key: 'recents', title: 'Recents', focusedIcon: 'history' },
        { key: 'settings', title: 'Settings', focusedIcon: 'application-settings', unfocusedIcon: 'application-settings-outline' },
    ]);

    const renderScene = BottomNavigation.SceneMap({
        favorites: MusicRoute,
        search: AlbumsRoute,
        recents: RecentsRoute,
        settings: NotificationsRoute,
    });

    return (
        <BottomNavigation
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={renderScene}
        />
    );
};

export default MyBottom;