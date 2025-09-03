import { fileURLToPath } from "url";
import tseslint from "typescript-eslint";
import globals from "globals";
import eslintPluginImport from "eslint-plugin-import";
import { defineConfig } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";
import js from "@eslint/js";
import { includeIgnoreFile } from "@eslint/compat";


export default defineConfig([
  includeIgnoreFile(
    fileURLToPath(new URL(".gitignore", import.meta.url)),
    "Imported .gitignore patterns",
  ),

  { ignores: ["package-lock.json", "package.json"] },

  // JS recommended (JS only) — no spreading
  { files: ["**/*.{js,mjs,cjs}"], ...js.configs.recommended },

  // TypeScript base recommended (scoped to TS files only)
  // Adds TS plugin + rules for *.ts without requiring parserOptions.project
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ["**/*.ts"],
  })),

  // Common rules for JS + TS that do NOT require TS type info
  {
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      }
    },
    files: ["**/*.{js,mjs,cjs,ts}"],
    ignores: ["**/*.html", "**/*.css", "**/*.scss"],
    languageOptions: {
      globals: { ...globals.node },
    },
    plugins: {
      import: eslintPluginImport,
      "@stylistic": stylistic,
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      "@stylistic/indent": ["error", 2],
      "@stylistic/max-len": ["error", { code: 100 }],
      "@stylistic/comma-dangle": ["error", "only-multiline"],
      "@stylistic/arrow-parens": ["error", "as-needed"],
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/array-bracket-spacing": ["error", "never"],

      // Import Rules (safe without TS type info)
      "import/newline-after-import": [
        "error", 
        { 
          count: 2, 
          exactCount: true, 
          considerComments: true 
        }
      ],
      "import/no-useless-path-segments": [
        "error", 
        { noUselessIndex: true }
      ],
      "import/prefer-default-export": [
        "error", 
        { target: "single" }
      ],
      "import/order": [
        "error", 
        {
          groups: [
            ["builtin", "external", "object"],
            ["internal", "index", "sibling", "parent"],
            "type",
          ],
          sortTypesGroup: true,
          pathGroups: [{ 
            pattern: "@shared/**", 
            group: "internal" 
          }],
          distinctGroup: false,
          "newlines-between": "always",
          alphabetize: { 
            order: "desc", 
            caseInsensitive: true 
          },
        }
      ],
    }
  },

  // TS typed rules (use project service to auto-discover tsconfigs)
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: fileURLToPath(new URL(".", import.meta.url)),
      },
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        ignoreRestSiblings: true
      }],
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        { 
          selector: "default", 
          format: ["camelCase"],
          leadingUnderscore: "allow"
        },
        { 
          selector: ["variable", "parameter", "function", "method"], 
          format: ["camelCase"], 
          leadingUnderscore: "allow",
        },
        { 
          selector: ["variable"], 
          format: ["camelCase", "UPPER_CASE", "PascalCase"], 
          modifiers: ["const"] ,
          leadingUnderscore: "allow"

        },
        { 
          selector: ["property", "parameterProperty", "classicAccessor"], 
          format: ["camelCase", "PascalCase"], 
          leadingUnderscore: "allow" 
        },
        { 
          selector: "property", 
          modifiers: ["static"], 
          format: ["camelCase", "UPPER_CASE"] 
        },
        { 
          selector: "enumMember", 
          format: ["PascalCase", "camelCase", "UPPER_CASE"] 
        },
        { 
          selector: "objectLiteralProperty", 
          format: ["camelCase", "UPPER_CASE"], 
          modifiers: ["requiresQuotes"] 
        },
        { 
          selector: ["typeLike", "class", "interface", "enum", "typeAlias"], 
          format: ["PascalCase"] 
        },
        { 
          selector: "import", 
          format: null 
        },
      ],
    }
  },

  // Allow JS config file to skip TS naming rule if it ever applies
  {
    files: ["eslint.config.js"],
    rules: {
      "@typescript-eslint/naming-convention": "off"
    },
  }
]);
