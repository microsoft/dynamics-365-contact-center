// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Base webpack configuration for all CTI Driver samples.
 * Provides common settings for development and production builds.
 *
 * Features:
 * - Tree shaking with usedExports
 * - Terser minification in production
 * - Content hashing for cache busting
 * - Bundle analysis support
 * - Development server with HMR
 */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

/**
 * Creates a webpack configuration with common settings
 * @param {Object} options - Configuration options
 * @param {string} options.entry - Entry point file path
 * @param {string} options.outputName - Output bundle name
 * @param {string} options.dirname - The __dirname of the calling config
 * @param {Object} [options.externals] - External dependencies
 * @returns {Function} Webpack configuration function
 */
module.exports = function createConfig(options) {
    const { entry, outputName, dirname, externals = {} } = options;

    return (env, argv) => {
        const isProduction = argv.mode === 'production';
        const isAnalyze = env && env.analyze;

        const config = {
            entry: {
                [outputName]: entry
            },

            output: {
                // Use content hash for cache busting in production
                filename: isProduction ? "[name].[contenthash:8].min.js" : "[name].js",
                path: path.resolve(dirname, "dist"),
                clean: true,
                // Library output settings
                library: {
                    name: outputName,
                    type: 'umd',
                    export: 'default'
                },
                globalObject: 'this'
            },

            mode: isProduction ? 'production' : 'development',

            // Source maps: full for dev, separate file for prod
            devtool: isProduction ? 'source-map' : 'eval-source-map',

            resolve: {
                extensions: [".ts", ".js"],
                alias: {
                    "@ccaas/CCaaSEmbedSDK/enums": path.resolve(dirname, "../ICCaaSEmbedSDK/typings/enums.ts"),
                    "@ccaas/CCaaSEmbedSDK": path.resolve(dirname, "../ICCaaSEmbedSDK/typings/CCaaSEmbedSDK.d.ts"),
                    "@ccaas/ictiinterface": path.resolve(dirname, "../ICTIInterface/typings/ICTI.d.ts"),
                    "@ccaas/core": path.resolve(dirname, "../core/src/index.ts")
                }
            },

            // External dependencies that shouldn't be bundled
            externals: {
                ...externals
            },

            module: {
                rules: [
                    {
                        test: /\.ts$/,
                        use: {
                            loader: "ts-loader",
                            options: {
                                transpileOnly: true, // Skip type checking (use tsc separately)
                                compilerOptions: {
                                    sourceMap: true
                                }
                            }
                        },
                        exclude: [/node_modules/, /__tests__/, /\.test\.ts$/]
                    }
                ]
            },

            optimization: {
                minimize: isProduction,
                minimizer: isProduction ? [
                    new TerserPlugin({
                        terserOptions: {
                            compress: {
                                drop_console: false, // Keep console for debugging
                                drop_debugger: true,
                                pure_funcs: ['console.debug'], // Remove debug logs in prod
                                passes: 2 // Multiple passes for better compression
                            },
                            mangle: {
                                safari10: true // Fix Safari 10 issues
                            },
                            format: {
                                comments: false // Remove comments
                            }
                        },
                        extractComments: false
                    })
                ] : [],
                // Tree shaking
                usedExports: true,
                sideEffects: true,
                // Module concatenation (scope hoisting)
                concatenateModules: isProduction,
                // Consistent module IDs for caching
                moduleIds: isProduction ? 'deterministic' : 'named',
                // Runtime chunk for better caching (optional, enable if needed)
                // runtimeChunk: 'single',
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
                client: {
                    overlay: {
                        errors: true,
                        warnings: false
                    }
                }
            },

            // Performance hints
            performance: {
                hints: isProduction ? 'warning' : false,
                maxEntrypointSize: 250000,
                maxAssetSize: 250000,
            },

            // Caching for faster rebuilds
            cache: {
                type: 'filesystem',
                buildDependencies: {
                    config: [__filename]
                }
            },

            stats: {
                colors: true,
                modules: false,
                children: false,
                chunks: false,
                chunkModules: false,
                // Show asset sizes
                assets: true,
                assetsSort: 'size'
            },

            plugins: []
        };

        // Add bundle analyzer in analyze mode
        if (isAnalyze) {
            try {
                const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
                config.plugins.push(new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    reportFilename: 'bundle-report.html',
                    openAnalyzer: true
                }));
            } catch (e) {
                console.warn('webpack-bundle-analyzer not installed. Run: npm install --save-dev webpack-bundle-analyzer');
            }
        }

        return config;
    };
};
