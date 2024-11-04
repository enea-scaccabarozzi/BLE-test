module.exports = {
  extends: ["expo", "plugin:prettier/recommended"],
  plugins: ["prettier", "neverthrow"],
  rules: {
    "prettier/prettier": "error",
    "neverthrow/must-use-result": "error",
    "import/no-cycle": "error",
    "import/order": [
      "error",
      {
        groups: [
          ["builtin", "external"],
          ["internal"],
          ["parent", "sibling"],
          ["type"],
        ],
        pathGroups: [
          {
            pattern: "@app/**",
            group: "internal",
            position: "before",
          },
        ],
        pathGroupsExcludedImportTypes: ["builtin"],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    project: ["./tsconfig.json"],
    // eslint-disable-next-line no-undef
    tsconfigRootDir: __dirname,
  },
};
