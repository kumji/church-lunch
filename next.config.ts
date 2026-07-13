import type { NextConfig } from "next";

// GitHub Actions에서 빌드할 때만 /church-lunch 서브패스를 붙인다.
// (로컬 개발 서버는 그대로 루트에서 실행되도록 유지)
const isGithubPages = process.env.GITHUB_ACTIONS === "true";
const basePath = isGithubPages ? "/church-lunch" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
