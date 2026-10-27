export default function getAppUrl() {
  const configuredUrl = process.env.APP_URL || 'https://act-ipd.onrender.com';
  return new URL(configuredUrl).origin;
}
