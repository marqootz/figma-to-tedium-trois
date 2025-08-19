const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    mode: argv.mode || 'development',
    devtool: false,
    
    entry: {
      plugin: './src/plugin/main.ts',
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    
    resolve: {
      extensions: ['.ts', '.js'],
    },
    
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                target: 'ES2017',
                module: 'ES2015',
                moduleResolution: 'node',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
              },
            },
          },
          exclude: /node_modules/,
        },
      ],
    },
    
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/plugin/ui.html',
        filename: 'ui.html',
        chunks: [],
        inject: false,
      }),
    ],
    
    optimization: {
      minimize: false,
    },
    
    target: 'node',
    externals: {
      figma: 'figma',
    },
  };
};