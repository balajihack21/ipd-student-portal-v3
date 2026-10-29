export default function getAppUrl() {
  const configuredUrl = process.env.APP_URL || 'https://act-ipd.site';
  return new URL(configuredUrl).origin;
}
