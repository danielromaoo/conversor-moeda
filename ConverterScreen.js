// VIEW — só apresenta o que o ViewModel fornece e repassa as ações do usuário.
// Sem fetch, sem validação e sem cálculo aqui.

import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useCurrencyConverter } from '../viewmodels/useCurrencyConverter';

function CurrencyPicker({ label, value, currencies, onChange, disabled }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.pickerBox, disabled && styles.disabled]}>
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          enabled={!disabled}
          accessibilityLabel={label}
        >
          {currencies.map((c) => (
            <Picker.Item key={c.code} label={`${c.code} — ${c.name}`} value={c.code} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

export default function ConverterScreen() {
  const vm = useCurrencyConverter();
  const pickersDisabled = vm.loadingCurrencies || vm.currencies.length === 0 || vm.loading;
  const canConvert = !vm.loading && !vm.loadingCurrencies && vm.currencies.length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Conversor de Moedas</Text>
        <Text style={styles.subtitle}>Taxas de referência da API Frankfurter</Text>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Valor</Text>
            <TextInput
              style={styles.input}
              value={vm.amountText}
              onChangeText={vm.changeAmount}
              placeholder="Ex.: 100 ou 10,50"
              keyboardType="decimal-pad"
              editable={!vm.loading}
              returnKeyType="done"
            />
          </View>

          {vm.loadingCurrencies && (
            <View style={styles.row}>
              <ActivityIndicator />
              <Text style={styles.info}> Carregando moedas...</Text>
            </View>
          )}

          {vm.currenciesError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{vm.currenciesError}</Text>
              <TouchableOpacity onPress={vm.reloadCurrencies}>
                <Text style={styles.link}>Tentar carregar novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          <CurrencyPicker
            label="Moeda de origem"
            value={vm.from}
            currencies={vm.currencies}
            onChange={vm.changeFrom}
            disabled={pickersDisabled}
          />

          <TouchableOpacity
            style={[styles.swap, pickersDisabled && styles.disabled]}
            onPress={vm.swapCurrencies}
            disabled={pickersDisabled}
            accessibilityLabel="Inverter moedas"
          >
            <Text style={styles.swapText}>⇅ Inverter moedas</Text>
          </TouchableOpacity>

          <CurrencyPicker
            label="Moeda de destino"
            value={vm.to}
            currencies={vm.currencies}
            onChange={vm.changeTo}
            disabled={pickersDisabled}
          />

          <TouchableOpacity
            style={[styles.button, !canConvert && styles.buttonDisabled]}
            onPress={vm.convert}
            disabled={!canConvert}
          >
            {vm.loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Converter</Text>
            )}
          </TouchableOpacity>
        </View>

        {vm.validationError && (
          <View style={styles.warnBox}>
            <Text style={styles.warnText}>{vm.validationError}</Text>
          </View>
        )}

        {vm.apiError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{vm.apiError}</Text>
            <TouchableOpacity onPress={vm.convert} disabled={!canConvert}>
              <Text style={styles.link}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {vm.result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Valor informado</Text>
            <Text style={styles.resultSmall}>{vm.result.amountText}</Text>
            <Text style={styles.resultLabel}>Valor convertido ({vm.result.to})</Text>
            <Text style={styles.resultBig}>{vm.result.convertedText}</Text>
            <Text style={styles.resultMeta}>Taxa: {vm.result.rateText}</Text>
            <Text style={styles.resultMeta}>Data de referência: {vm.result.dateText}</Text>
            <Text style={styles.disclaimer}>
              Taxa de referência, não uma cotação comercial em tempo real.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f2f5f9' },
  container: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#12263f' },
  subtitle: { fontSize: 14, color: '#5b6b7f', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#3a4a5e', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#cfd8e3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    backgroundColor: '#fff',
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: '#cfd8e3',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  info: { color: '#5b6b7f' },
  swap: { alignSelf: 'center', paddingVertical: 4, marginBottom: 10 },
  swapText: { color: '#1e6fd9', fontWeight: '600' },
  button: {
    backgroundColor: '#1e6fd9',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { backgroundColor: '#9db9e0' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  warnBox: {
    backgroundColor: '#fff6e0',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#f2d48a',
  },
  warnText: { color: '#7a5a00' },
  errorBox: {
    backgroundColor: '#fdecec',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#f0b4b4',
  },
  errorText: { color: '#9b1c1c' },
  link: { color: '#1e6fd9', fontWeight: '600', marginTop: 8 },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#2e9e5b',
    elevation: 2,
  },
  resultLabel: { fontSize: 12, color: '#5b6b7f', marginTop: 6 },
  resultSmall: { fontSize: 18, color: '#12263f' },
  resultBig: { fontSize: 30, fontWeight: '700', color: '#2e9e5b', marginBottom: 8 },
  resultMeta: { fontSize: 14, color: '#3a4a5e', marginTop: 2 },
  disclaimer: { fontSize: 12, color: '#7a8798', marginTop: 10, fontStyle: 'italic' },
});