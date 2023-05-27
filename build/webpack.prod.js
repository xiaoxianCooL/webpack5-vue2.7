/*
 *@author: thx
 *@description:生产环境打包配置文件 在生产环境中,主要优化的是减少请求数,占用资源空间大小,减少单个打包的chunk文件过大.
 *@date: 2023-05-15 09:30:32
 *@version: V1.0.5
*/
const os = require("os");
const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
// 编译速度分析
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const smp = new SpeedMeasurePlugin();
const devPlugingConfig = smp.wrap({})
const threads = os.cpus().length;//获取cpu进程数量

const glob = require('glob');
const { PurgeCSSPlugin } = require('purgecss-webpack-plugin');
const PATH = {
  src: path.resolve(__dirname, 'src')
}
/*
 *@description:返回loader
 *@date: 2023-05-27 10:06:14
*/
const getStyleLoaders = (pre) => {
  return [
    //压缩css代码 使用MiniCssExtractPlugin插件 提取到单独的css文件中 为每个包含 CSS 的 JS 文件创建一个 CSS 文件
    MiniCssExtractPlugin.loader,
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
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, '../../vue-dist/fssc'),
    filename: "static/js/[name].[contenthash:10].js",
    chunkFilename: "static/js/[name].[contenthash:10].chunk.js",
    assetModuleFilename: "static/media/[hash:10][ext][query]",
    clean: true,
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
  plugins: [
    new PurgeCSSPlugin({//去除没用被引用的css代码
      paths: glob.sync(`${PATH.src}/**/*`, { nodir: true }),
      safelist: {
        standard: [/^el-/, "body", "html"], // 过滤以el-开头的类名，哪怕没用到也不删除
      },
      whitelist: ["html", "body"],
      whitelistPatterns: [
        /-(leave|enter|appear)(|-(to|from|active))$/,
        /^(?!(|.*?:)cursor-move).+-move$/,
        /^router-link(|-exact)-active$/,
        /data-v-.*/,
        /class/,
        /^el-/
      ],
      whitelistPatternsChildren: [/^token/, /^pre/, /^code/, /^el-/]
    }),
  ],
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "../public"),
          to: path.resolve(__dirname, "../../vue-dist/fssc"),
          globOptions: {
            // 忽略index.html文件
            ignore: ["**/index.html"],
          },
        },
        {
          from: path.resolve(__dirname, '../static'),
          to: path.resolve(__dirname, "../../vue-dist/fssc"),
          globOptions: {
            // 忽略index.html文件
            ignore: ["**/index.html"],
          },
        }
      ],
    }),
    new MiniCssExtractPlugin({
      filename: "static/css/[name].[contenthash:10].css",
      chunkFilename: "static/css/[name].[contenthash:10].chunk.css",
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vue: {
          test: /[\\/]node_modules[\\/]vue(.*)?[\\/]/,
          name: "vue-chunk",
          priority: 40,
        },
        elementui: {
          name: "element-ui",
          test: /element-ui/,
          chunks: "all",
          priority: 20,
        },
        libs: {
          test: /[\\/]node_modules[\\/]/,
          name: "libs-chunk",
          priority: 10,
        },
      },
    },
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}.js`,
    },
    minimize: true,//是否开启压缩配置
    //压缩的操作
    minimizer: [
      //css压缩
      new CssMinimizerPlugin(),//使用 cssnano 优化和压缩 CSS。
      //js压缩
      new TerserPlugin({
        parallel: threads,//使用多进程并发运行以提高构建速度 Boolean
        terserOptions: {
          compress: {
            drop_console: true,//移除所有console相关代码；
            drop_debugger: true,//移除所有debugger相关代码；
            pure_funcs: ["console.log", "console.error", "alert"],//移除指定的指令
          },
          format: {
            comments: false,//删除代码里面所有注释
          },
        },
        extractComments: false,//是否将注释剥离到单独的文件中
      }),
      //图片压缩
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminGenerate,
          options: {
            plugins: [
              ["gifsicle", { interlaced: true }],
              ["jpegtran", { progressive: true }],
              ["optipng", { optimizationLevel: 5 }],
              [
                "svgo",
                {
                  plugins: [
                    "preset-default",
                    "prefixIds",
                    {
                      name: "sortAttrs",
                      params: {
                        xmlnsOrder: "alphabetical",
                      }
                    }
                  ]
                }
              ]
            ]
          }
        }
      }),
    ],
  },
  devtool: 'source-map',//由于压缩后的代码只有一行 此处配置包含行列映射
  cache: {
    type: 'filesystem',
  },
  parallelism: threads,//使用最大cpu核心打包
  mode: 'production'
}, devPlugingConfig)