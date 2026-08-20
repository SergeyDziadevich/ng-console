const nx = require("@nx/eslint-plugin");

module.exports = [
  ...nx.configs["flat/base"],
  ...nx.configs["flat/typescript"],
  ...nx.configs["flat/javascript"],
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: false,
          allowCircularSelfDependency: true,
          allow: ["@ng-console/shared/**", "@ng-console-platform/**", "@env/**", "@app/**"],
          depConstraints: [
            {
              sourceTag: "scope:root",
              onlyDependOnLibsWithTags: ["*"],
            },
            {
              sourceTag: "scope:shell",
              onlyDependOnLibsWithTags: ["scope:shared", "scope:mfe-remote", "scope:shared-models", "scope:shared-data-access", "scope:shared-ui", "scope:shared-layout", "scope:shared-util", "*"],
            },
            {
              sourceTag: "scope:mfe-remote",
              onlyDependOnLibsWithTags: ["scope:shared", "scope:shared-models", "scope:shared-data-access", "scope:shared-ui", "scope:shared-layout", "scope:shared-util"],
            },
            {
              sourceTag: "scope:shared-layout",
              onlyDependOnLibsWithTags: ["scope:shared", "scope:shared-ui", "scope:shared-data-access", "scope:shared-models", "scope:shared-util"],
            },
            {
              sourceTag: "scope:shared-ui",
              onlyDependOnLibsWithTags: ["scope:shared", "scope:shared-models", "scope:shared-util"],
            },
            {
              sourceTag: "scope:shared-data-access",
              onlyDependOnLibsWithTags: ["scope:shared", "scope:shared-models", "scope:shared-util"],
            },
            {
              sourceTag: "scope:shared-util",
              onlyDependOnLibsWithTags: ["scope:shared", "scope:shared-models"],
            },
            {
              sourceTag: "scope:shared-models",
              onlyDependOnLibsWithTags: [],
            },
            {
              sourceTag: "*",
              onlyDependOnLibsWithTags: ["*"],
            },
          ],
        },
      ],
    },
  },
];