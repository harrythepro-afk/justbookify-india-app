export const APP_ENVIRONMENTS = ['development', 'staging', 'production'] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

export function parseAppEnvironment(value: unknown): AppEnvironment {
  const match = APP_ENVIRONMENTS.find((environment) => environment === value);
  if (match === undefined) {
    throw new Error(`APP_ENV must be one of: ${APP_ENVIRONMENTS.join(', ')}.`);
  }
  return match;
}
