import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  isRunning: boolean;
  phase?: string;
}

export function StatusBadge({ isRunning, phase }: StatusBadgeProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.dot, isRunning ? styles.dotRunning : styles.dotIdle]} />
      <Text style={styles.label}>
        {isRunning ? (phase ? phase.replace(/_/g, ' ').toUpperCase() : 'RUNNING') : 'IDLE'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  dotRunning: {
    backgroundColor: '#6BBF8A',
    shadowColor: '#6BBF8A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  dotIdle: {
    backgroundColor: '#999',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
    letterSpacing: 1,
  },
});
