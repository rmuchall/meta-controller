module.exports = {
    testEnvironment: "node",
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
