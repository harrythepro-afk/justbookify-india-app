// Sentry's Metro config gives each bundle and its source map a matching debug ID, so release
// builds can upload source maps and Sentry can resolve stack traces (D-042).
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
