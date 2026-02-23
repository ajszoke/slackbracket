import { FlatCompat } from "@eslint/eslintrc";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const config = [
  {
    ignores: [".next/**", "node_modules/**", "eslint.config.mjs"]
  },
  ...compat.extends("next/core-web-vitals", "plugin:import/recommended", "prettier"),
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      import: importPlugin,
      "unused-imports": unusedImports
    },
    rules: {
      "import/order": [
        "warn",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true }
        }
      ],
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_"
        }
      ]
    }
  }
];

export default config;
