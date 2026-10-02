import { StyleSheet, Text, View } from 'react-native';

import { getAppEnvironment, getEnvironmentLabel } from '@/config';

export default function PlaceholderScreen() {
  const environment = getAppEnvironment();

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        JustBookify
      </Text>
      <Text style={styles.body}>The app is set up. Screens arrive in later tasks.</Text>
      {environment !== 'production' && (
        <Text style={styles.environment}>{getEnvironmentLabel(environment)} build</Text>
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
});
