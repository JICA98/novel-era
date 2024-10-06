import * as React from 'react';
import { BottomNavigation, Text } from 'react-native-paper';
import { create } from 'zustand'
import SearchLayout from './search';
import Recents from './recents';
import FavoriteScreen from './favorites/_layout';
import Settings from './settings';

export const indexes = {
    favorites: 0,
    search: 1,
    recents: 2,
    settings: 3
}

const FavoritesRoute = () => <FavoriteScreen />;

const SearchRoute = () => <SearchLayout />;

const RecentsRoute = () => <Recents />;

const SettingsRoute = () => <Settings />;

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
        favorites: FavoritesRoute,
        search: SearchRoute,
        recents: RecentsRoute,
        settings: SettingsRoute,
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