module.exports = {
    preset: "ts-jest",
    modulePathIgnorePatterns: [
        "<rootDir>/build/"
    ],
    coverageReporters: [
        // "html",
        // "lcov",
        "text-summary"
    ]
};
