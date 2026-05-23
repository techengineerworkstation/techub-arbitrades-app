import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CycleRecord, FeeBreakdown } from '@arbitrades/shared';
import { getApiClient } from '../lib/api';

export function HistoryScreen() {
  const [history, setHistory] = useState<CycleRecord[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [lastFees, setLastFees] = useState<FeeBreakdown | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [historyRes, feesRes] = await Promise.all([
        getApiClient().getHistory(),
        getApiClient().getFees(),
      ]);

      if (historyRes.success && historyRes.data) {
        setHistory(historyRes.data.history);
        setTotalProfit(historyRes.data.total_profit);
        setCyclesCompleted(historyRes.data.cycles_completed);
        setError(null);
      } else {
        setError(historyRes.error || 'Failed to fetch history');
      }

      if (feesRes.success && feesRes.data) {
        setLastFees(feesRes.data);
      }
    } catch {
      setError('Cannot reach API server');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const last10 = history.slice(-10);
  const maxProfit = Math.max(
    ...last10.map((c) => Math.abs(c.net_profit ?? 0)),
    0.001
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D6A4F" />
      }
    >
      <Text style={styles.title}>Profit History</Text>
      <Text style={styles.subtitle}>{cyclesCompleted} cycles completed</Text>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Total Profit */}
      <View style={styles.profitCard}>
        <Text style={styles.profitLabel}>Total Profit</Text>
        <Text
          style={[
            styles.profitValue,
            { color: totalProfit >= 0 ? '#2D6A4F' : '#D32F2F' },
          ]}
        >
          {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(4)}
        </Text>
        <Text style={styles.profitSub}>USDT retained on MEXC</Text>
      </View>

      {/* Bar Chart */}
      {last10.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last {last10.length} Cycles</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartArea}>
              {/* Zero line */}
              <View style={styles.zeroLine} />
              <View style={styles.barsRow}>
                {last10.map((cycle, index) => {
                  const profit = cycle.net_profit ?? 0;
                  const barHeight = Math.max(
                    (Math.abs(profit) / maxProfit) * 80,
                    4
                  );
                  const isPositive = profit >= 0;
                  return (
                    <View key={cycle.id} style={styles.barWrapper}>
                      <View style={styles.barColumn}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: barHeight,
                              backgroundColor: isPositive
                                ? '#2D6A4F'
                                : '#D32F2F',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>
                        #{cycle.cycle_number}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: '#2D6A4F' }]}
                />
                <Text style={styles.legendText}>Profit</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: '#D32F2F' }]}
                />
                <Text style={styles.legendText}>Loss</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Fee Breakdown */}
      {lastFees && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Cycle Fees</Text>
          <View style={styles.feeCard}>
            <FeeRow
              label="Poloniex TRN Withdrawal"
              value={lastFees.poloniex_trn_withdrawal}
            />
            <FeeRow
              label="MEXC USDT Withdrawal"
              value={lastFees.mexc_usdt_withdrawal}
            />
            <View style={styles.feeDivider} />
            <FeeRow
              label="Total Fees"
              value={lastFees.total_fees}
              isBold
            />
            <FeeRow
              label="Estimated Net Profit"
              value={lastFees.estimated_net_profit}
              isBold
              isProfit
            />
          </View>
        </View>
      )}

      {/* Cycle List */}
      {history.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cycle Details</Text>
          {history
            .slice(-10)
            .reverse()
            .map((cycle) => (
              <View key={cycle.id} style={styles.cycleItem}>
                <View style={styles.cycleLeft}>
                  <Text style={styles.cycleNumber}>
                    #{cycle.cycle_number}
                  </Text>
                  <Text style={styles.cycleAmount}>
                    ${cycle.start_amount_usdt} USDT
                  </Text>
                </View>
                <View style={styles.cycleRight}>
                  <Text
                    style={[
                      styles.cycleProfit,
                      {
                        color:
                          (cycle.net_profit ?? 0) >= 0
                            ? '#2D6A4F'
                            : '#D32F2F',
                      },
                    ]}
                  >
                    {(cycle.net_profit ?? 0) >= 0 ? '+' : ''}$
                    {(cycle.net_profit ?? 0).toFixed(4)}
                  </Text>
                  <Text style={styles.cycleStatus}>{cycle.status}</Text>
                </View>
              </View>
            ))}
        </View>
      )}

      {history.length === 0 && !error && (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color="#CCC" />
          <Text style={styles.emptyText}>No cycles recorded yet</Text>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function FeeRow({
  label,
  value,
  isBold,
  isProfit,
}: {
  label: string;
  value: number;
  isBold?: boolean;
  isProfit?: boolean;
}) {
  const color = isProfit
    ? value >= 0
      ? '#2D6A4F'
      : '#D32F2F'
    : '#1B1B1B';

  return (
    <View style={styles.feeRow}>
      <Text style={[styles.feeLabel, isBold && styles.feeLabelBold]}>
        {label}
      </Text>
      <Text
        style={[
          styles.feeValue,
          isBold && styles.feeValueBold,
          { color },
        ]}
      >
        ${value.toFixed(4)}
      </Text>
    </View>
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D6A4F',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
    marginBottom: 20,
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
  profitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profitLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    marginBottom: 4,
  },
  profitValue: {
    fontSize: 38,
    fontWeight: '800',
  },
  profitSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
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
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chartArea: {
    height: 120,
    justifyContent: 'flex-end',
  },
  zeroLine: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 90,
    paddingBottom: 20,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barColumn: {
    justifyContent: 'flex-end',
    height: 80,
  },
  bar: {
    width: 16,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 9,
    color: '#999',
    marginTop: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#888',
  },
  feeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  feeLabel: {
    fontSize: 14,
    color: '#888',
  },
  feeLabelBold: {
    color: '#1B1B1B',
    fontWeight: '600',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1B1B1B',
  },
  feeValueBold: {
    fontWeight: '700',
  },
  feeDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  cycleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cycleLeft: {
    gap: 4,
  },
  cycleNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D6A4F',
  },
  cycleAmount: {
    fontSize: 12,
    color: '#888',
  },
  cycleRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  cycleProfit: {
    fontSize: 15,
    fontWeight: '700',
  },
  cycleStatus: {
    fontSize: 11,
    color: '#999',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
});
