// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const createConfig = require('../webpack.base.js');

module.exports = createConfig({
    entry: "./src/GenesysCloudExampleCTIDriver.ts",
    outputName: "GenesysCloudExampleCTIDriver",
    dirname: __dirname
});
