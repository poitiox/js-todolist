module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint"],
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      rules: {
        complexity: ["error", 10],
        "max-depth": ["error", 3],
        "@typescript-eslint/no-explicit-any": "error",
      },
    },
  ],
};
