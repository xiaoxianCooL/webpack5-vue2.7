/*
 *@author: thx
 *@description: webpack 公共部分 若区分的逻辑太多,请区分开维护到对应的环境配置文件
 *@date: 2023-05-22 17:34:28
*/
const os = require("os");
const path = require('path');
const EslintWebpackPlugin = require("eslint-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { DefinePlugin } = require("webpack");
const threads = os.cpus().length;//获取cpu进程数量

module.exports = {
    context: path.resolve(__dirname, '../'),
    performance: {
        hints: 'warning', // false关闭
        maxEntrypointSize: 100000000, // 最大入口文件大小
        maxAssetSize: 100000000, // 最大资源文件大小
        assetFilter: function (assetFilename) { //只给出js文件的性能提示
            return assetFilename.endsWith('.js');
        }
    },
    resolve: {
        // 自动补全文件扩展名
        extensions: [".vue", ".js", ".json"],
        alias: {
            '@': path.resolve(__dirname, "../src"),
        }
    },
    entry: './src/main.js',  //指定入口文件
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: "vue-loader",
                options: {
                    // 开启缓存
                    cacheDirectory: path.resolve(__dirname, "../node_modules/.cache/vue-loader"),
                },
            },
            {
                test: /\.js$/,
                include: [path.resolve(__dirname, "../src")],//确定loader作用的文件
                exclude: [
                    /node_modules\/core-js\//,
                    /@babel(?:\/|\{1,2})runtime|core-js/,
                ],
                use: [
                    {
                        loader: "thread-loader",//独立线程处理 仅非常耗时的loader使用 且前置
                        options: {
                            works: threads,//使用的进程数量
                        }
                    },
                    {
                        loader: "babel-loader",
                        options: {
                            cacheDirectory: true,//开启babel缓存 
                            cacheCompression: false,//关闭缓存文件压缩
                            plugins: ["@babel/plugin-transform-runtime"],//由于babel-loader会为每个文件注入大量辅助代码并且定义多次 使用插件只去这里面找 只引用一次 减少代码体积
                        },
                    },
                ],
            },
            //减少请求 将小的图片或者小的字体通过base64的形式插入到js文件中，这样在请求js文件的时候，浏览器解析到需要展示图片就不需要额外去请求一次资源
            {
                test: /\.(jpe?g|png|gif|webp|svg)$/,
                type: 'asset',
                include: [path.resolve(__dirname, "../src")],
                parser: {
                    dataUrlCondition: {
                        maxSize: 5 * 1024, // 10kb
                    }
                },
                generator: {
                    filename: "static/images/[hash:10][ext][query]",
                },
            },
            // 处理其他资源
            {
                test: /\.(ttf|woff|woff2?)$/i,
                type: "asset/resource",
                generator: {
                    filename: "static/iconfont/[hash:10][ext][query]",
                },
            },
            {
                test: /\.(map3|map4|avi)$/i,
                type: "asset/resource",
                generator: {
                    filename: "static/media/[hash:10][ext][query]",
                },
            },
        ]
    },
    plugins: [
        new EslintWebpackPlugin({
            context: path.resolve(__dirname, "../src"),
            exclude: "node_modules",
            cache: true,
            cacheLocation: path.resolve(__dirname, "../node_modules/.cache/.eslintcache"),
        }),
        new VueLoaderPlugin(),
        // cross-env定义的环境变量给打包工具使用
        // DefinePlugin定义环境变量给源代码使用
        new DefinePlugin({
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false,
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'public/index.html',
            inject: true,
            cache: true, // 当文件没有发生任何改变时, 直接使用之前的缓存
        }),
    ],
}