module.exports = {
  extends: ["expo", "prettier"],
  plugins: ["prettier", "neverthrow"],
  rules: {
    "prettier/prettier": "error",
    "neverthrow/must-use-result": "error",
    "import/no-cycle": "error",
    "import/order": [
      "error",
      {
        groups: [
          ["builtin", "external"], // Built-in and external together
          ["internal"], // Internal @penny/ imports
          ["parent", "sibling"], // Relative imports (parent and sibling)
          ["type"], // TypeScript type imports
        ],
        pathGroups: [
          {
            pattern: "@app/**",
            group: "internal",
            position: "before",
          },
        ],
        pathGroupsExcludedImportTypes: ["builtin"],
        "newlines-between": "always", // Enforce newline between groups
        alphabetize: {
          order: "asc",
          caseInsensitive: true, // Case insensitive sorting
        },
      },
    ],
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
};
