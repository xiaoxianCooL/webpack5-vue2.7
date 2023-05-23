/*
 *@author: thx
 *@description: webpack 公共部分
 *@date: 2023-05-22 17:34:28
*/
const os =require("os");
const path = require('path');
const { VueLoaderPlugin } = require("vue-loader");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ProgressPlugin } = require("webpack");
const threads = os.cpus().length;//获取cpu进程数量
function resolve(dir) {
    return path.join(__dirname, '..', dir)
}

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
        extensions: ['.js', '.vue', '.json'],
        alias: {
            'vue$': 'vue/dist/vue.esm.js',
            '@': resolve('src'),
        }
    },
    optimization: {
        // 此设置保证有新增的入口文件时,原有缓存的chunk文件仍然可用
        moduleIds: "deterministic",
        // 值为"single"会创建一个在所有生成chunk之间共享的运行时文件
        runtimeChunk: "single",
        splitChunks: {
            // 设置为all, chunk可以在异步和非异步chunk之间共享。
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendors",
                    chunks: "all",
                },
            },
        },
    },
    entry: './src/main.js',  //指定入口文件
    module: {
        rules: [ //文件后缀名的匹配规则
            {
                test: /\.vue$/,
                loader: "vue-loader"
            },
            {
                test: /\.m?js$/,
                include: [path.resolve(__dirname, "../src")],//确定loader作用的文件
                exclude: [
                    /node_modules\/core-js\//,
                    /@babel(?:\/|\{1,2})runtime|core-js/,
                ],
                use: [
                    {
                        loader: "thread-loader",//独立线程处理 仅非常耗时的loader使用 且前置
                        options:{
                            works:threads,//使用的进程数量
                        }
                    },
                    {
                        loader: "babel-loader",
                        options: {
                            cacheDirectory: true,//开启babel缓存 
                            cacheCompression:false,//关闭缓存文件压缩
                            plugins:["@babel/plugin-transform-runtime"],//由于babel-loader会为每个文件注入大量辅助代码并且定义多次 使用插件只去这里面找 只引用一次 减少代码体积
                        },
                    },
                ],
            },
            {
                test: /\.(ttf|woff|woff2?)$/i,
                type: "asset/resource",//不需要转base64
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
        new VueLoaderPlugin(),
        new ProgressPlugin({
            activeModules: true, // 默认false，显示活动模块计数和一个活动模块正在进行消息。
            entries: true, // 默认true，显示正在进行的条目计数消息。
            modules: false, // 默认true，显示正在进行的模块计数消息。
            modulesCount: 5000, // 默认5000，开始时的最小模块数。PS:modules启用属性时生效。
            profile: false, // 默认false，告诉ProgressPlugin为进度步骤收集配置文件数据。
            dependencies: false, // 默认true，显示正在进行的依赖项计数消息。
            dependenciesCount: 10000, // 默认10000，开始时的最小依赖项计数。PS:dependencies启用属性时生效。
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'public/index.html',
            inject: true,
            cache: true, // 当文件没有发生任何改变时, 直接使用之前的缓存
        }),
    ],
    mode: 'development',
}