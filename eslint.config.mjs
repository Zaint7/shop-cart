import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "src/generated/**",
      "node_modules/**"
    ]
  },
  {
    files: ["src/**/*.js"],
    languageOptions: {
      globals: globals.node
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }]
    }
  }
];