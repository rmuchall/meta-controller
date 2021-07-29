module.exports = {
    root: true,
    env: {
        node: true,
        commonjs: true
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking"
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: "./tsconfig.json"
    },
    plugins: [
        "@typescript-eslint"
    ],
    ignorePatterns: [
        ".eslintrc.js",
        "jest.config.js"
    ],
    rules: {
        // Style - Enable
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        // Nodejs - Enable
        "require-await": "error",
        "no-return-await": "error",
        "@typescript-eslint/explicit-module-boundary-types": "error",
        "@typescript-eslint/unbound-method": ["error", {"ignoreStatic": true}],
        // NodeJs - Disable
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-explicit-any": "off",
        // Project specific - Disable
        "@typescript-eslint/ban-types": "off",
    }
};
