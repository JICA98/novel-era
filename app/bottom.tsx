import * as React from 'react';
import { BottomNavigation, Text } from 'react-native-paper';

const MusicRoute = () => <Text>Music</Text>;

const AlbumsRoute = () => <Text>Albums</Text>;

const RecentsRoute = () => <Text>Recents</Text>;

const NotificationsRoute = () => <Text>Notifications</Text>;

const MyBottom = () => {
    const [index, setIndex] = React.useState(0);
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