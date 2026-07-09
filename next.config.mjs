import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // ... resto de tu configuración
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Esto soluciona el conflicto de Turbopack
  experimental: {
    webpackBuildWorker: true,
    turbopack: {}, 
  },
};

export default withPWA(nextConfig);