import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';

const { width } = Dimensions.get('window');

// Define the type for a single tab
export interface Tab {
  title: string;
  content: JSX.Element;
}

// Define the props for the TabBar component
export interface TabBarProps {
  tabs: Tab[];
  selectedIndex: number;
  onTabPress: (index: number) => void;
}

// Define the TabBar component
export const TabBar: React.FC<TabBarProps> = ({ tabs, selectedIndex, onTabPress }) => {
  const colors = useTheme().colors;
  return (
    <View style={[styles.tabBarContainer, { backgroundColor: colors.backdrop }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[{
              borderBottomColor: colors.primary,
              borderBottomWidth: selectedIndex === index ? 2 : 0,
            }, styles.tabItem]}
            onPress={() => onTabPress(index)}
          >
            <Text style={[{
              color: colors.onBackground,
            }, styles.tabText, selectedIndex === index && styles.selectedTabText]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Define the props for the TabView component
export interface TabViewProps {
  tabs: Tab[];
}

// Define the TabView component
export const TabView: React.FC<TabViewProps> = ({ tabs }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <View style={styles.container}>
      <View style={styles.stickyTabBar}>
        <TabBar
          tabs={tabs}
          selectedIndex={selectedIndex}
          onTabPress={setSelectedIndex}
        />
      </View>
      <View style={styles.contentContainer}>
        {tabs[selectedIndex].content}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyTabBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  tabBarContainer: {
    flexDirection: 'row',
    position: 'relative',
  },
  tabItem: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'light',
  },
  selectedTabText: {
    fontWeight: 'bold',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 4,
    width: width / 2, // Assuming there are 2 tabs
  },
  contentContainer: {
    flex: 1,
    marginTop: 56, // Adjust this value based on the height of your tab bar
  },
});

export default TabView;