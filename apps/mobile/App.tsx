import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { PricesScreen } from './src/screens/PricesScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type Tab = 'dashboard' | 'prices' | 'history' | 'settings';

const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; iconFocused: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline', iconFocused: 'grid' },
  { key: 'prices', label: 'Prices', icon: 'trending-up-outline', iconFocused: 'trending-up' },
  { key: 'history', label: 'History', icon: 'bar-chart-outline', iconFocused: 'bar-chart' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', iconFocused: 'settings' },
];

function getScreen(tab: Tab) {
  switch (tab) {
    case 'dashboard':
      return <DashboardScreen />;
    case 'prices':
      return <PricesScreen />;
    case 'history':
      return <HistoryScreen />;
    case 'settings':
      return <SettingsScreen />;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Screen Content */}
        <View style={styles.screenContainer}>
          {getScreen(activeTab)}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isActive ? tab.iconFocused : tab.icon}
                  size={22}
                  color={isActive ? '#2D6A4F' : '#AAA'}
                />
                <Text
                  style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                >
                  {tab.label}
                </Text>
                {isActive && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: '#AAA',
    marginTop: 3,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#2D6A4F',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#2D6A4F',
  },
});
