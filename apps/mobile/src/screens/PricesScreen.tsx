import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PriceSpread } from '@arbitrades/shared';
import { getApiClient } from '../lib/api';

export function PricesScreen() {
  const [prices, setPrices] = useState<PriceSpread | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await getApiClient().getPrices();
      if (res.success && res.data) {
        setPrices(res.data);
        setError(null);
      } else {
        setError(res.error || 'Failed to fetch prices');
      }
    } catch {
      setError('Cannot reach API server');
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPrices();
    setRefreshing(false);
  }, [fetchPrices]);

  const spreadColor = prices && prices.spread_percent > 0 ? '#2D6A4F' : '#D32F2F';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D6A4F" />
      }
    >
      <Text style={styles.title}>Price Monitor</Text>
      <Text style={styles.subtitle}>TRN/USDT across exchanges</Text>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Spread Display */}
      {prices && (
        <View style={styles.spreadCard}>
          <Text style={styles.spreadLabel}>Current Spread</Text>
          <Text style={[styles.spreadValue, { color: spreadColor }]}>
            {prices.spread_percent.toFixed(2)}%
          </Text>
          <Text style={styles.spreadDollar}>
            ${prices.spread.toFixed(6)} difference
          </Text>
        </View>
      )}

      {/* Exchange Cards */}
      <View style={styles.exchangeRow}>
        <View style={[styles.exchangeCard, styles.poloniexCard]}>
          <View style={styles.exchangeHeader}>
            <View style={[styles.exchangeDot, { backgroundColor: '#2D6A4F' }]} />
            <Text style={styles.exchangeName}>Poloniex</Text>
          </View>
          <Text style={styles.exchangeLabel}>Buy TRN</Text>
          <Text style={styles.priceText}>
            {prices ? `$${prices.poloniex_price.toFixed(6)}` : '--'}
          </Text>
        </View>

        <View style={styles.arrowContainer}>
          <Ionicons name="arrow-forward" size={24} color="#2D6A4F" />
        </View>

        <View style={[styles.exchangeCard, styles.mexcCard]}>
          <View style={styles.exchangeHeader}>
            <View style={[styles.exchangeDot, { backgroundColor: '#6BBF8A' }]} />
            <Text style={styles.exchangeName}>MEXC</Text>
          </View>
          <Text style={styles.exchangeLabel}>Sell TRN</Text>
          <Text style={styles.priceText}>
            {prices ? `$${prices.mexc_price.toFixed(6)}` : '--'}
          </Text>
        </View>
      </View>

      {/* Flow Diagram */}
      <View style={styles.flowSection}>
        <Text style={styles.sectionTitle}>Arbitrage Flow</Text>
        <View style={styles.flowCard}>
          <FlowStep
            icon="logo-usd"
            label="Buy TRN"
            detail="Poloniex"
            color="#2D6A4F"
            isFirst
          />
          <FlowArrow network="Arbitrum One" />
          <FlowStep
            icon="swap-horizontal"
            label="Transfer"
            detail="Bridge TRN"
            color="#40916C"
          />
          <FlowArrow network="Network" />
          <FlowStep
            icon="cash"
            label="Sell TRN"
            detail="MEXC"
            color="#6BBF8A"
          />
          <FlowArrow network="BSC BEP20" />
          <FlowStep
            icon="repeat"
            label="Return"
            detail="USDT back"
            color="#1B4332"
            isLast
          />
        </View>
        <View style={styles.repeatBadge}>
          <Ionicons name="infinite" size={16} color="#2D6A4F" />
          <Text style={styles.repeatText}>Repeat Cycle</Text>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function FlowStep({
  icon,
  label,
  detail,
  color,
  isFirst,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail: string;
  color: string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={styles.flowStep}>
      <View style={[styles.flowDot, { backgroundColor: color }]}>
        <Ionicons name={icon} size={18} color="#FFF" />
      </View>
      <Text style={styles.flowLabel}>{label}</Text>
      <Text style={styles.flowDetail}>{detail}</Text>
    </View>
  );
}

function FlowArrow({ network }: { network: string }) {
  return (
    <View style={styles.flowArrow}>
      <View style={styles.flowArrowLine} />
      <Text style={styles.flowArrowNetwork}>{network}</Text>
      <Ionicons name="chevron-forward" size={14} color="#999" />
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
  spreadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  spreadLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    marginBottom: 4,
  },
  spreadValue: {
    fontSize: 42,
    fontWeight: '800',
  },
  spreadDollar: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  exchangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  exchangeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  poloniexCard: {
    borderTopWidth: 3,
    borderTopColor: '#2D6A4F',
  },
  mexcCard: {
    borderTopWidth: 3,
    borderTopColor: '#6BBF8A',
  },
  exchangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  exchangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  exchangeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  exchangeLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flowSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  flowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  flowStep: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  flowDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  flowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  flowDetail: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  flowArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 6,
  },
  flowArrowLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E0E0E0',
  },
  flowArrowNetwork: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  repeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  repeatText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D6A4F',
  },
});
