// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const createConfig = require('../webpack.base.js');

module.exports = createConfig({
    entry: "./src/SNExampleCTIDriver.ts",
    outputName: "SNCTIDriver",
    dirname: __dirname
});
