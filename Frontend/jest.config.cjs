module.exports = {
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/src/test/setup.js"],
    testMatch: ["<rootDir>/src/**/*.test.jsx", "<rootDir>/src/**/*.test.js"],
    transform: {
        "^.+\\.[jt]sx?$": ["babel-jest", {
            presets: [["@babel/preset-env", { targets: { node: "current" } }], ["@babel/preset-react", { runtime: "automatic" }]],
            plugins: [require.resolve("./src/test/vite-env.cjs")],
        }],
    },
    clearMocks: true,
};
