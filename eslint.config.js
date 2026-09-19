import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
    { ignores: ["dist/**", "drizzle/**", ".superpowers/**"] },
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: { project: "./tsconfig.test.json", tsconfigRootDir: import.meta.dirname }
        },
        rules: {
            "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
            "@typescript-eslint/consistent-indexed-object-style": "error",
            "@typescript-eslint/consistent-type-assertions": "error",
            "@typescript-eslint/consistent-type-definitions": "error",
            "@typescript-eslint/consistent-type-exports": ["error", { fixMixedExportsWithInlineTypeSpecifier: true }],
            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
            "@typescript-eslint/member-ordering": ["error", { default: { memberTypes: [
                "signature", "call-signature",
                "public-static-field", "protected-static-field", "private-static-field", "#private-static-field",
                "public-instance-field", "protected-instance-field", "private-instance-field", "#private-instance-field",
                "field",
                "static-initialization",
                "constructor",
                "public-static-get", "public-static-set", "public-instance-get", "public-instance-set", "get", "set",
                "public-static-method", "protected-static-method", "private-static-method", "#private-static-method",
                "public-instance-method", "protected-instance-method", "private-instance-method", "#private-instance-method",
                "method"
            ], order: "alphabetically" } }],
            "@typescript-eslint/no-deprecated": "error",
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/restrict-template-expressions": "off",
            "arrow-parens": "error",
            "brace-style": "error",
            "comma-dangle": "error",
            "comma-spacing": "error",
            "curly": ["error", "multi-line"],
            "eol-last": "error",
            "indent": ["error", 4, { SwitchCase: 1 }],
            "keyword-spacing": "error",
            "max-len": ["error", { code: 120, ignoreComments: true, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreRegExpLiterals: true }],
            "no-fallthrough": "error",
            "no-floating-decimal": "error",
            "no-multiple-empty-lines": "error",
            "no-multi-spaces": "error",
            "no-throw-literal": "error",
            "no-trailing-spaces": "error",
            "no-unneeded-ternary": "error",
            "no-var": "error",
            "object-curly-spacing": ["error", "always"],
            "object-shorthand": ["error", "consistent-as-needed"],
            "prefer-const": "error",
            "quotes": ["error", "double", { avoidEscape: true }],
            "semi": ["error", "always"],
            "space-infix-ops": "error",
            "yoda": "error"
        }
    },
    {
        files: ["tests/**/*.ts"],
        rules: {
            "@typescript-eslint/consistent-type-imports": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/unbound-method": "off",
            "@typescript-eslint/explicit-function-return-type": "off"
        }
    }
);
