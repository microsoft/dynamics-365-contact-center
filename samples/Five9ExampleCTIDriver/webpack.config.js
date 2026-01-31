// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const createConfig = require('../webpack.base.js');

module.exports = createConfig({
    entry: "./src/Five9ExampleCTIDriver.ts",
    outputName: "Five9ExampleCTIDriver",
    dirname: __dirname
});
