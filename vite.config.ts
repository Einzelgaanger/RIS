import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL || "https://onzmlqasojipycnayjkv.supabase.co";
  const supabasePublishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uem1scWFzb2ppcHljbmF5amt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTU2NDUsImV4cCI6MjA4OTQzMTY0NX0.5Won3vtdI2a5-cqvOH1qxFeAuTt_vSnEyBe4dUgDvgA";
  const supabaseProjectId = env.VITE_SUPABASE_PROJECT_ID || "onzmlqasojipycnayjkv";

  return {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(supabaseProjectId),
    },
    server: {
      host: "::",
      port: 8080,
      allowedHosts: ["ris.vgg.app", "ris-c6w2.onrender.com"],
      hmr: {
        overlay: false,
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
