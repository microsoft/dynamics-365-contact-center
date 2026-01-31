// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const createConfig = require('../webpack.base.js');

module.exports = createConfig({
    entry: "./src/ZendeskExampleCTIDriver.ts",
    outputName: "ZendeskExampleCTIDriver",
    dirname: __dirname
});
