/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3, puppeteer는 서버 번들에서 제외 (Next 15 stable 키)
  serverExternalPackages: ["better-sqlite3", "puppeteer"],
};
export default nextConfig;
