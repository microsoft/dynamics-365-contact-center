const path = require("path");

module.exports = {
  entry: {
    SNCTIDriver: "./SNCTIDriver/src/SNCTIDriver.ts"
  },
  output: {
    filename: "[name].js", // Output bundle filename
    path: path.resolve(
      "./force-app/main/default/staticresources/assets/",
      "dist"
    ) // Output directory
  },
  mode: 'development',
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
  }
};
