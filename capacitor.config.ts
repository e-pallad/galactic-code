import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.galacticcode.app",
  appName: "Galactic Code",
  webDir: "out",
  server: {
    // Points to the deployed web app — no static export required.
    // Replace with your production URL before running npx cap add android/ios.
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://your-production-url.com",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#080C14",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
  },
};

export default config;
