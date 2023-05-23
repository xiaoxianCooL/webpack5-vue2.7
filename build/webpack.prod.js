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
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const ESLintPlugin = require('eslint-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
// 编译速度分析
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();
const devPlugingConfig = smp.wrap({})
const threads = os.cpus().length;//获取cpu进程数量

const glob = require('glob');
const { PurgeCSSPlugin } = require('purgecss-webpack-plugin');
const PATH = {
  src: path.resolve(__dirname, 'src')
}

module.exports = merge(common, {
  stats: "errors-warnings",//只在发生错误或有警告时输出
  output: {
    path: path.resolve(__dirname, '../../vue-dist/fssc'),
    filename: 'js/[name].js',
    publicPath: '/',
    clean: true, // 每次构建都清除dist包
  },
  module: {
    rules: [
      {
        //每个文件与一个loader匹配 就停止继续检索 优化编译效率
        oneOf: [
          //压缩css代码 使用MiniCssExtractPlugin插件 提取到单独的css文件中 为每个包含 CSS 的 JS 文件创建一个 CSS 文件
          {
            test: /\.(sa|sc|c)ss$/,
            use: [
              MiniCssExtractPlugin.loader,
              "css-loader",
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: {
                    plugins: ["postcss-preset-env"],//解决大多数浏览器样式兼容问题
                  }
                }
              },
              "sass-loader"
            ],
          },
          //减少请求 将小的图片或者小的字体通过base64的形式插入到js文件中，这样在请求js文件的时候，浏览器解析到需要展示图片就不需要额外去请求一次资源
          {
            test: /\.(png|jpe?g|gif|svg|eot|otf)$/,
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
          },
        ]
      }
    ]
  },
  plugins: [
    new ESLintPlugin({
      context: path.resolve(__dirname, "src"),
      exclude: "node_modules",
      cache: true,//开启eslint编译缓存
      cacheLocation: path.resolve(__dirname, '../node_modules/.cache/eslintcache'),
      threads,
    }),
    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash:6].css",
      ignoreOrder: true
    }),
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
  optimization: {
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
    splitChunks: {
      chunks: "all",
      minSize: 30 * 1024, // 30KB chunk文件的最小值
      //maxSize: 2 * 1024 * 1024, //1M
      minChunks: 2,//最小引入次数

      maxAsyncRequests: 10, // 按需加载的最大并行请求数目
      maxInitialRequests: 5, // 在入口点的并行请求的最大数目
      name: "default",
      cacheGroups: {  //根据设置的test匹配特定的依赖将该代码分割出去
        default: false,
        vendor: {
          name: "vendor",
          test: /node_modules/,
          chunks: "all",
          priority: 10,//优先级
        },
        elementui: {
          name: "element-ui",
          test: /element-ui/,
          chunks: "all",
          priority: 20,
        }
      }
    },
  },
  // devtool: 'source-map',//由于压缩后的代码只有一行 此处配置包含行列映射
  cache: {
    type: 'filesystem',
  },
  parallelism: threads,//使用最大cpu核心打包
  mode: 'production'
}, devPlugingConfig)