// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const createConfig = require('../webpack.base.js');

module.exports = createConfig({
    entry: "./src/GenericExampleCTIDriver.ts",
    outputName: "GenericExampleCTIDriver",
    dirname: __dirname
});
