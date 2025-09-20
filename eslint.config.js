import globals from "globals";
import pluginJs from "@eslint/js";
import importPlugin from "eslint-plugin-import";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["app-web/**"],
  },
  {
    files: ["**/*.js"],
    plugins: { import: importPlugin },
    languageOptions: { 
      globals: globals.node, 
      sourceType: "module",
      ecmaVersion: 2022
    },
    rules: {
      "import/no-unresolved": "error",
      "import/named": "error",
    }
  },
  pluginJs.configs.recommended,
];