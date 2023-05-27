/*
 *@author: thx
 *@description:开发环境打包配置文件
 *@modifyContent:
 *@date: 2023-05-15 09:30:58
*/
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
// 编译速度分析
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();
const devPlugingConfig = smp.wrap({})

/*
 *@description:返回loader
 *@date: 2023-05-27 10:06:14
*/
const getStyleLoaders = (pre) => {
  return [
      'vue-style-loader',
      'css-loader',
      {
          loader: 'postcss-loader',
          options: {
              postcssOptions: {
                  plugins: ["postcss-preset-env"],//配合package beowserslist 解决大多数浏览器样式兼容问题
              }
          }
      },
      pre,
  ].filter(Boolean);
}

module.exports = merge(common, {
  stats: "errors-warnings",//只在发生错误或有警告时输出
  entry: "./src/main.js",
  output: {
    path: undefined,
    filename: "static/js/[name].js",
    chunkFilename: "static/js/[name].chunk.js",
    assetModuleFilename: "static/media/[hash:10][ext][query]",
    publicPath: '/',
  },
  module: {
    rules: [
      {
        //每个文件与一个loader匹配就立刻停止继续检索 优化编译效率
        oneOf: [
          {
            test: /\.css$/,
            use: getStyleLoaders(),
          },
          {
            test: /\.s[ac]ss$/,
            use: getStyleLoaders('sass-loader'),
          },
        ],
      },
    ]
  },
  optimization: {
    splitChunks: {
      chunks: "all",
    },
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}.js`,
    },
  },
  //开发服务器配置
  devServer: {
    host: "localhost",
    // static: {
    //   publicPath: '/',
    // },
    historyApiFallback: true,
    open: true,
    // compress: true,
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
