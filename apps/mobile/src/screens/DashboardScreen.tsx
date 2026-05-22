import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AMOUNT_PRESETS, type EngineStatus } from '@arbitrades/shared';
import { getApiClient } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { StatCard } from '../components/StatCard';
import { PhaseTimeline } from '../components/PhaseTimeline';

export function DashboardScreen() {
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [amount, setAmount] = useState('25');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await getApiClient().getStatus();
      if (res.success && res.data) {
        setStatus(res.data);
        setError(null);
      } else {
        setError(res.error || 'Failed to fetch status');
      }
    } catch (e) {
      setError('Cannot reach API server');
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  }, [fetchStatus]);

  const handleStart = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid trading amount.');
      return;
    }
    setLoading(true);
    try {
      const res = await getApiClient().startEngine(numAmount);
      if (!res.success) {
        Alert.alert('Error', res.error || 'Failed to start engine');
      }
    } catch {
      Alert.alert('Error', 'Cannot reach API server');
    }
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const res = await getApiClient().stopEngine();
      if (!res.success) {
        Alert.alert('Error', res.error || 'Failed to stop engine');
      }
    } catch {
      Alert.alert('Error', 'Cannot reach API server');
    }
    setLoading(false);
  };

  const formatUptime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const isRunning = status?.is_running ?? false;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D6A4F" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Arbitrades</Text>
          <Text style={styles.subtitle}>TRN Arbitrage Engine</Text>
        </View>
        <StatusBadge isRunning={isRunning} phase={status?.current_phase} />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Amount Presets */}
      {!isRunning && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trading Amount (USDT)</Text>
          <View style={styles.presetsRow}>
            {AMOUNT_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetBtn,
                  amount === String(preset) && styles.presetBtnActive,
                ]}
                onPress={() => setAmount(String(preset))}
              >
                <Text
                  style={[
                    styles.presetText,
                    amount === String(preset) && styles.presetTextActive,
                  ]}
                >
                  ${preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Custom amount..."
            placeholderTextColor="#999"
          />
        </View>
      )}

      {/* Start / Stop */}
      <View style={styles.controls}>
        {isRunning ? (
          <TouchableOpacity
            style={[styles.controlBtn, styles.stopBtn]}
            onPress={handleStop}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="stop" size={22} color="#FFF" />
                <Text style={styles.controlBtnText}>Stop Engine</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.controlBtn, styles.startBtn]}
            onPress={handleStart}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="play" size={22} color="#FFF" />
                <Text style={styles.controlBtnText}>Start Engine</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Cycles"
          value={String(status?.cycles_completed ?? 0)}
          icon="repeat"
          color="#2D6A4F"
        />
        <StatCard
          label="Total Profit"
          value={`$${(status?.total_profit ?? 0).toFixed(4)}`}
          icon="trending-up"
          color="#40916C"
        />
      </View>
      <View style={styles.statsGrid}>
        <StatCard
          label="Uptime"
          value={formatUptime(status?.uptime_seconds ?? 0)}
          icon="time"
          color="#6BBF8A"
        />
        <StatCard
          label="Remaining"
          value={formatUptime(status?.remaining_seconds ?? 0)}
          icon="hourglass"
          color="#1B4332"
        />
      </View>

      {/* Current Cycle */}
      {isRunning && status?.current_cycle ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Cycle</Text>
          <View style={styles.cycleCard}>
            <View style={styles.cycleRow}>
              <Text style={styles.cycleLabel}>Amount</Text>
              <Text style={styles.cycleValue}>
                ${status.current_cycle.start_amount_usdt} USDT
              </Text>
            </View>
            {status.current_cycle.buy_price && (
              <View style={styles.cycleRow}>
                <Text style={styles.cycleLabel}>Buy Price</Text>
                <Text style={styles.cycleValue}>
                  ${status.current_cycle.buy_price.toFixed(6)}
                </Text>
              </View>
            )}
            {status.current_cycle.trn_quantity && (
              <View style={styles.cycleRow}>
                <Text style={styles.cycleLabel}>TRN Qty</Text>
                <Text style={styles.cycleValue}>
                  {status.current_cycle.trn_quantity.toFixed(2)}
                </Text>
              </View>
            )}
            {status.current_cycle.net_profit !== null && (
              <View style={styles.cycleRow}>
                <Text style={styles.cycleLabel}>Net Profit</Text>
                <Text
                  style={[
                    styles.cycleValue,
                    {
                      color:
                        status.current_cycle.net_profit >= 0
                          ? '#2D6A4F'
                          : '#D32F2F',
                    },
                  ]}
                >
                  ${status.current_cycle.net_profit.toFixed(4)}
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : null}

      {/* Phase Timeline */}
      {isRunning && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cycle Progress</Text>
          <PhaseTimeline currentPhase={status?.current_phase ?? 'monitoring'} />
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  content: {
    padding: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D6A4F',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetBtnActive: {
    borderColor: '#2D6A4F',
    backgroundColor: '#E8F5E9',
  },
  presetText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  presetTextActive: {
    color: '#2D6A4F',
  },
  amountInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1B1B1B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  controls: {
    marginBottom: 20,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  startBtn: {
    backgroundColor: '#2D6A4F',
  },
  stopBtn: {
    backgroundColor: '#D32F2F',
  },
  controlBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  cycleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cycleLabel: {
    fontSize: 14,
    color: '#888',
  },
  cycleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
  },
});
