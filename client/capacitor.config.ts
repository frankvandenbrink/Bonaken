import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'nl.frankvdbrink.bonaken',
  appName: 'Bonaken',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
