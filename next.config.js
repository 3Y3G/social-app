module.exports = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = "source-map"
    }
    return config
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
}

