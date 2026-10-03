import { StyleSheet, Text, View } from 'react-native';

import { getAppEnvironment, getEnvironmentLabel, getStoreConfigStatus } from '@/config';

export default function PlaceholderScreen() {
  const environment = getAppEnvironment();

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        JustBookify
      </Text>
      <Text style={styles.body}>The app is set up. Screens arrive in later tasks.</Text>
      {environment !== 'production' && (
        <>
          <Text style={styles.environment}>{getEnvironmentLabel(environment)} build</Text>
          {/* Status only. The store's values never appear on screen. */}
          <Text style={styles.status}>Store configuration: {getStoreConfigStatus()}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 16, textAlign: 'center' },
  environment: { fontSize: 14, marginTop: 16, color: '#666' },
  status: { fontSize: 14, marginTop: 4, color: '#666' },
});
