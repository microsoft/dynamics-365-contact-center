// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: '<rootDir>/tsconfig.test.json'
        }]
    },
    testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/*.test.ts'
    ],
    moduleNameMapper: {
        '^@ccaas/CCaaSEmbedSDK$': '<rootDir>/ICCaaSEmbedSDK/typings/CCaaSEmbedSDK.d.ts',
        '^@ccaas/CCaaSEmbedSDK/enums$': '<rootDir>/ICCaaSEmbedSDK/typings/enums.ts',
        '^@ccaas/ictiinterface$': '<rootDir>/ICTIInterface/typings/ICTI.d.ts',
        '^@ccaas/core$': '<rootDir>/core/src/index.ts'
    },
    collectCoverageFrom: [
        '**/src/**/*.ts',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/*.d.ts',
        '!**/EmbedSDKSampleUsage.ts',
        '!**/utils.ts',
        '!ServiceNowExampleCTIDriver/**'
    ],
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 30,
            functions: 20,
            lines: 30,
            statements: 30
        },
        // Higher thresholds for core utilities
        './core/src/utils/': {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90
        }
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    verbose: true,
    testTimeout: 10000
};
