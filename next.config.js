/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configurare pentru a evita probleme cu încărcarea chunk-urilor
  webpack: (config, { isServer }) => {
    // Modifică configurația webpack doar pentru client
    if (!isServer) {
      // Setează un timeout mai mare pentru încărcarea chunk-urilor
      config.output.chunkLoadTimeout = 60000 // 60 secunde
    }

    return config
  },
  // Dezactivează compresarea pentru a reduce complexitatea build-ului
  compress: false,
}

module.exports = nextConfig

