import type { CapacitorConfig } from "@capacitor/cli";

const baseConfig = {
  appId: "com.anomalous.chat",
  appName: "Anomalous",
  webDir: "out",
  plugins: {
    Keyboard: {
      resize: "none" as const,
      resizeOnFullScreen: false,
    },
  },
};

const devConfig: CapacitorConfig = {
  ...baseConfig,
  server: {
    // Use your machine's local IP so the simulator can reach the dev server
    // Update this if your IP changes (run: ipconfig getifaddr en0)
    url: "http://192.168.1.138:3000",
    cleartext: true,
  },
};

const prodConfig: CapacitorConfig = {
  ...baseConfig,
  server: {
    androidScheme: "https",
  },
};

const config = process.env.NODE_ENV === "development" ? devConfig : prodConfig;

export default config;
