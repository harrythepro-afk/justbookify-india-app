import Constants from 'expo-constants';

import { type AppEnvironment, parseAppEnvironment } from './appEnvironment';

const ENVIRONMENT_LABELS: Record<AppEnvironment, string> = {
  development: 'Development',
  staging: 'Staging',
  production: 'Production',
};

export function getAppEnvironment(): AppEnvironment {
  return parseAppEnvironment(Constants.expoConfig?.extra?.appEnv);
}

export function getEnvironmentLabel(environment: AppEnvironment): string {
  return ENVIRONMENT_LABELS[environment];
}
