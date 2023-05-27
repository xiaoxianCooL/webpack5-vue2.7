module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ["plugin:vue/essential",
    "eslint:recommended"],
  parserOptions: {
    parser: "@babel/eslint-parser",
  },
  rules: {
    "no-var": "off", //暂时警告var定义的变量 后期改造后配置为2 禁止使用var
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
  },
};