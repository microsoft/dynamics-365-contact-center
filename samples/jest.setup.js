// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Jest setup file - runs before each test file
 */

// Mock window.Microsoft.CCaaS.EmbedSDK
global.window = global.window || {};

// Reset mocks between tests
beforeEach(() => {
    jest.clearAllMocks();

    // Reset window globals
    delete window.Microsoft;
    delete window.CCaaS;
    delete window.sforce;
    delete window.openFrameAPI;
});

// Suppress console output during tests unless debugging
if (process.env.DEBUG !== 'true') {
    global.console = {
        ...console,
        log: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    };
}
