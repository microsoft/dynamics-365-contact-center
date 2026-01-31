// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Base webpack configuration for all CTI Driver samples.
 * Provides common settings for development and production builds.
 */

const path = require('path');

/**
 * Creates a webpack configuration with common settings
 * @param {Object} options - Configuration options
 * @param {string} options.entry - Entry point file path
 * @param {string} options.outputName - Output bundle name
 * @param {string} options.dirname - The __dirname of the calling config
 * @returns {Function} Webpack configuration function
 */
module.exports = function createConfig(options) {
    const { entry, outputName, dirname } = options;

    return (env, argv) => {
        const isProduction = argv.mode === 'production';

        return {
            entry: {
                [outputName]: entry
            },

            output: {
                filename: isProduction ? "[name].min.js" : "[name].js",
                path: path.resolve(dirname, "dist"),
                clean: true
            },

            mode: isProduction ? 'production' : 'development',

            // Source maps: full for dev, separate file for prod
            devtool: isProduction ? 'source-map' : 'eval-source-map',

            resolve: {
                extensions: [".ts", ".js"],
                alias: {
                    "@ccaas/CCaaSEmbedSDK/enums": path.resolve(dirname, "../ICCaaSEmbedSDK/typings/enums.ts"),
                    "@ccaas/CCaaSEmbedSDK": path.resolve(dirname, "../ICCaaSEmbedSDK/typings/CCaaSEmbedSDK.d.ts"),
                    "@ccaas/ictiinterface": path.resolve(dirname, "../ICTIInterface/typings/ICTI.d.ts")
                }
            },

            module: {
                rules: [
                    {
                        test: /\.ts$/,
                        use: {
                            loader: "ts-loader",
                            options: {
                                transpileOnly: !isProduction, // Faster builds in dev
                                compilerOptions: {
                                    sourceMap: true
                                }
                            }
                        },
                        exclude: /node_modules/
                    }
                ]
            },

            optimization: {
                minimize: isProduction,
                usedExports: true, // Tree shaking
            },

            // Development server configuration
            devServer: {
                static: {
                    directory: path.join(dirname, 'dist'),
                },
                compress: true,
                port: 3000,
                hot: true,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
            },

            // Performance hints
            performance: {
                hints: isProduction ? 'warning' : false,
                maxEntrypointSize: 250000,
                maxAssetSize: 250000,
            },

            stats: {
                colors: true,
                modules: false,
                children: false,
                chunks: false,
                chunkModules: false
            }
        };
    };
};
