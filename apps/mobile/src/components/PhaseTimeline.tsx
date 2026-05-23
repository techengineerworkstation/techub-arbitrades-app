import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PHASES, PHASE_DESCRIPTIONS } from '@arbitrades/shared';

interface PhaseTimelineProps {
  currentPhase: string;
}

export function PhaseTimeline({ currentPhase }: PhaseTimelineProps) {
  const currentPhaseIndex = PHASES.findIndex((p) => p.id === currentPhase);
  const description = PHASE_DESCRIPTIONS[currentPhase] || '';

  return (
    <View style={styles.container}>
      <View style={styles.timeline}>
        {PHASES.map((phase, index) => {
          const isActive = index === currentPhaseIndex;
          const isComplete = index < currentPhaseIndex;
          return (
            <View key={phase.id} style={styles.phaseWrapper}>
              <View
                style={[
                  styles.dot,
                  isActive && styles.dotActive,
                  isComplete && styles.dotComplete,
                ]}
              >
                <Text
                  style={[
                    styles.dotText,
                    (isActive || isComplete) && styles.dotTextActive,
                  ]}
                >
                  {phase.icon}
                </Text>
              </View>
              {index < PHASES.length - 1 && (
                <View
                  style={[
                    styles.line,
                    isComplete && styles.lineComplete,
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {PHASES.map((phase, index) => {
          const isActive = index === currentPhaseIndex;
          return (
            <Text
              key={phase.id}
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {phase.label}
            </Text>
          );
        })}
      </View>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phaseWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotActive: {
    backgroundColor: '#2D6A4F',
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  dotComplete: {
    backgroundColor: '#6BBF8A',
  },
  dotText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
  },
  dotTextActive: {
    color: '#FFF',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 2,
  },
  lineComplete: {
    backgroundColor: '#6BBF8A',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  label: {
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
    flex: 1,
  },
  labelActive: {
    color: '#2D6A4F',
    fontWeight: '700',
  },
  description: {
    marginTop: 12,
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 18,
  },
});
