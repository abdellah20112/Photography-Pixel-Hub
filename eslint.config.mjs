import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [".next/**", "node_modules/**", "public/**", "uploads/**"],
  },
];

export default eslintConfig;
