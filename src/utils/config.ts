/**
 * Application Configuration
 * Manages environment variables and app-wide settings
 */

interface AppConfig {
  cloudflareApiEndpoint: string;
  environment: 'development' | 'production';
  cache: {
    ttlSeconds: number;
    maxSizeMB: number;
  };
  alert: {
    checkIntervalMinutes: number;
  };
}

const config: AppConfig = {
  cloudflareApiEndpoint:
    process.env.CLOUDFLARE_API_ENDPOINT || 'https://api.cloudflare.com/client/v4/graphql',
  environment: (process.env.NODE_ENV as 'development' | 'production') || 'development',
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10),
    maxSizeMB: parseInt(process.env.MAX_CACHE_SIZE_MB || '50', 10),
  },
  alert: {
    checkIntervalMinutes: parseInt(process.env.ALERT_CHECK_INTERVAL_MINUTES || '5', 10),
  },
};

export default config;
