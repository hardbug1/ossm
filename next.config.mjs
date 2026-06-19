/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3, puppeteer는 서버 컴포넌트 번들에서 제외 (Next 14.2 키)
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "puppeteer"],
  },
};
export default nextConfig;
