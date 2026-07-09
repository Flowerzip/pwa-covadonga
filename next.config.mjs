/** @type {import('next').NextConfig} */
const nextConfig = {
  // Eliminamos la llamada directa a withPWAInit por ahora para ver si el build pasa
  // Si esto funciona, sabremos que el plugin es el que causa el conflicto
};

export default nextConfig;