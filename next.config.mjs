/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // WebContainer 需要的跨域隔离头部
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  serverExternalPackages: [
    'metascraper',
    'metascraper-author',
    'metascraper-date', 
    'metascraper-description',
    'metascraper-image',
    'metascraper-logo',
    'metascraper-title',
    'metascraper-url',
    're2',
    '@mozilla/readability',
    'pdf-parse',
    'mammoth',
    'xlsx'
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 服务端：允许原生模块
      config.externals = [...(config.externals || []), 're2'];
    } else {
      // 客户端：忽略这些模块
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    });

    return config;
  },
}

export default nextConfig
