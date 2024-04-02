// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const path = require('path');
console.log(__dirname);
module.exports = {
    entry: {
        SFExampleCTIDriver: "./src/SFExampleCTIDriver.ts"
    },
    output: {
        filename: "[name].js", // Output bundle filename
        path: path.resolve(
            "./",
            "dist"
        ) // Output directory
    },
    resolve: {
        extensions: [".ts"] // Allow importing TypeScript files without extension
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader", // Use ts-loader to transpile TypeScript files
                exclude: /node_modules/
            }
        ]
    },
};
