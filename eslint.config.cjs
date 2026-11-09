const { FlatCompat } = require("@eslint/eslintrc");
const legacyConfig = require("./.eslintrc.cjs");

// 课程验收保留旧格式配置，兼容层让当前 ESLint 直接使用同一份规则。
const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = compat.config(legacyConfig);
