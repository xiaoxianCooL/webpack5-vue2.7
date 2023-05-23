/*
 *@author: thx
 *@description:开发环境打包配置文件
 *@modifyContent:
 *@date: 2023-05-15 09:30:58
*/
const os =require("os");
const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const ESLintPlugin = require('eslint-webpack-plugin');
const threads = os.cpus().length;//获取cpu进程数量
// 编译速度分析
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();
const devPlugingConfig = smp.wrap({})

module.exports = merge(common, {
  stats: "errors-warnings",//只在发生错误或有警告时输出
  output: {
    path: undefined,
    filename: '[name].js',
    publicPath: '/',
    clean: true, // 每次构建都清除dist包
  },
  module: {
    rules: [
      {
        //每个文件与一个loader匹配 就停止继续检索 优化编译效率
        oneOf: [
          {
            test: /\.(sass|scss|css)$/,
            use: [
              'style-loader',
              {
                loader: 'css-loader',
                options: { sourceMap: true, importLoaders: 1, modules: false },
              },
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions:{
                    plugins: ["postcss-preset-env"],//解决大多数浏览器样式兼容问题
                  }
                }
              },
              { loader: 'sass-loader', options: { sourceMap: true } },
            ],
          },
          {
            test: /\.(png|jpe?g|gif|svg|woff2?|eot|ttf|otf)$/,
            type: "asset",
            include: [path.resolve(__dirname, "../src")],
            parser: {
              dataUrlCondition: {
                maxSize: 5 * 1024, // 10kb
              }
            },
            generator: {
              filename: 'images/[name].[contenthash:6][ext]'
            },

          }
        ]
      }
    ]
  },
  plugins: [
    new ESLintPlugin({
      context: path.resolve(__dirname, "src"),
      exclude:"node_modules",
      cache:true,//开启eslint编译缓存
      cacheLocation:path.resolve(__dirname,'../node_modules/.cache/eslintcache'),//文件缓存地址
      threads,//编译开启的核心
    })
  ],
  //开发服务器配置
  devServer: {
    static: {
      // directory: path.join(__dirname, 'public'),
      publicPath: '/',
    },
    historyApiFallback: true,
    open: false,
    compress: true,
    hot: true,//开启HMR 启动后仅编译修改文件 极速加快构建速度
    port: 8080,
  },
  cache: {
    type: 'filesystem',
    buildDependencies: {
      // 开启持久化缓存 缓存生成的 webpack 模块和 chunk 改善构建速度
      config: [__filename],
    },
  },
  devtool: "eval-cheap-module-source-map",
  mode: "development",
}, devPlugingConfig)
