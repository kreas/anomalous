import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.anomalous.chat',
  appName: 'Anomalous',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
}

export default config
