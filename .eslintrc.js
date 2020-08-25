module.exports = {
    root: true,
    env: {
        node: true
    },
    parser: "@typescript-eslint/parser",
    plugins: [
        "@typescript-eslint"
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    rules: {
        "no-control-regex": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/member-delimiter-style": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/explicit-module-boundary-types": ["error", {"allowArgumentsExplicitlyTypedAsAny": true}],
    }
};
