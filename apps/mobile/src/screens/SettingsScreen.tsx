import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_CONFIG, type EngineConfig } from '@arbitrades/shared';
import { getApiClient, getApiUrl, setApiUrl } from '../lib/api';

export function SettingsScreen() {
  const [spreadThreshold, setSpreadThreshold] = useState(
    String(DEFAULT_CONFIG.spread_threshold ?? 0.5)
  );
  const [cycleDuration, setCycleDuration] = useState(
    String(DEFAULT_CONFIG.cycle_duration_hours ?? 24)
  );
  const [apiUrl, setApiUrlState] = useState(getApiUrl());
  const [saving, setSaving] = useState(false);

  const handleSaveConfig = async () => {
    const threshold = parseFloat(spreadThreshold);
    const duration = parseFloat(cycleDuration);

    if (isNaN(threshold) || threshold <= 0) {
      Alert.alert('Invalid Value', 'Spread threshold must be a positive number.');
      return;
    }
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Invalid Value', 'Cycle duration must be a positive number.');
      return;
    }

    setSaving(true);
    try {
      const config: EngineConfig = {
        spread_threshold: threshold,
        cycle_duration_hours: duration,
      };
      const res = await getApiClient().updateConfig(config);
      if (res.success) {
        Alert.alert('Saved', 'Configuration updated successfully.');
      } else {
        Alert.alert('Error', res.error || 'Failed to update config');
      }
    } catch {
      Alert.alert('Error', 'Cannot reach API server');
    }
    setSaving(false);
  };

  const handleSaveApiUrl = () => {
    const trimmed = apiUrl.trim();
    if (!trimmed) {
      Alert.alert('Invalid URL', 'API URL cannot be empty.');
      return;
    }
    setApiUrl(trimmed);
    Alert.alert('Saved', `API URL set to ${trimmed}`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Engine configuration</Text>

      {/* API URL */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Connection</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>API Base URL</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrlState}
            placeholder="https://arbitrades.sbs"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveApiUrl}>
            <Ionicons name="globe" size={16} color="#FFF" />
            <Text style={styles.saveBtnText}>Update URL</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Engine Config */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Engine Parameters</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Spread Threshold (%)</Text>
            <Text style={styles.fieldHint}>
              Minimum spread required to trigger a cycle
            </Text>
            <TextInput
              style={styles.input}
              value={spreadThreshold}
              onChangeText={setSpreadThreshold}
              keyboardType="numeric"
              placeholder="0.5"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Cycle Duration (hours)</Text>
            <Text style={styles.fieldHint}>
              Maximum time allowed per cycle
            </Text>
            <TextInput
              style={styles.input}
              value={cycleDuration}
              onChangeText={setCycleDuration}
              keyboardType="numeric"
              placeholder="24"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSaveConfig}
            disabled={saving}
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFF" />
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Network Route Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Route</Text>
        <View style={styles.card}>
          <RouteRow
            step="1"
            label="Buy TRN"
            exchange="Poloniex"
            network=""
            color="#2D6A4F"
          />
          <RouteRow
            step="2"
            label="Withdraw TRN"
            exchange="Poloniex"
            network="Arbitrum One"
            color="#40916C"
          />
          <RouteRow
            step="3"
            label="Deposit TRN"
            exchange="MEXC"
            network="Arbitrum One"
            color="#6BBF8A"
          />
          <RouteRow
            step="4"
            label="Sell TRN"
            exchange="MEXC"
            network=""
            color="#2D6A4F"
          />
          <RouteRow
            step="5"
            label="Withdraw USDT"
            exchange="MEXC"
            network="BSC BEP20"
            color="#40916C"
          />
          <RouteRow
            step="6"
            label="Deposit USDT"
            exchange="Poloniex"
            network="BSC BEP20"
            color="#1B4332"
            isLast
          />
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <InfoRow label="App" value="Arbitrades Mobile" />
          <InfoRow label="Version" value="1.0.0" />
          <InfoRow label="Protocol" value="TRN/USDT Arbitrage" />
          <InfoRow label="Exchanges" value="Poloniex + MEXC" isLast />
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function RouteRow({
  step,
  label,
  exchange,
  network,
  color,
  isLast,
}: {
  step: string;
  label: string;
  exchange: string;
  network: string;
  color: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.routeRow, !isLast && styles.routeRowBorder]}>
      <View style={[styles.routeStep, { backgroundColor: color }]}>
        <Text style={styles.routeStepText}>{step}</Text>
      </View>
      <View style={styles.routeInfo}>
        <Text style={styles.routeLabel}>{label}</Text>
        <Text style={styles.routeDetail}>
          {exchange}
          {network ? ` (${network})` : ''}
        </Text>
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  field: {
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  fieldHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F0E8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1B1B1B',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D6A4F',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  routeRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  routeStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeStepText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  routeDetail: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
  },
});
