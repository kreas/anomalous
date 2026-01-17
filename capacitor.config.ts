import type { CapacitorConfig } from "@capacitor/cli";

const devConfig: CapacitorConfig = {
  appId: "com.anomalous.chat",
  appName: "Anomalous",
  webDir: "out",
  server: {
    // Use your machine's local IP so the simulator can reach the dev server
    // Update this if your IP changes (run: ipconfig getifaddr en0)
    url: "http://192.168.1.138:3000",
    cleartext: true,
  },
};

const prodConfig: CapacitorConfig = {
  appId: "com.anomalous.chat",
  appName: "Anomalous",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
};

const config = process.env.NODE_ENV === "development" ? devConfig : prodConfig;

export default config;
