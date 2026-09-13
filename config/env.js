const CONFIG_KEYS = [
  'PORT',
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'CLIENT_URL',
  'GOOGLE_CLIENT_ID',
  'ADMIN_EMAILS'
];

function loadAppConfig() {
  if (!process.env.APP_CONFIG) return;

  let config;
  try {
    config = JSON.parse(process.env.APP_CONFIG);
  } catch (error) {
    throw new Error(`APP_CONFIG must be valid JSON: ${error.message}`);
  }

  if (!config || Array.isArray(config) || typeof config !== 'object') {
    throw new Error('APP_CONFIG must be a JSON object');
  }

  for (const key of CONFIG_KEYS) {
    if (!process.env[key] && config[key] !== undefined && config[key] !== null) {
      process.env[key] = String(config[key]);
    }
  }
}

module.exports = loadAppConfig;
