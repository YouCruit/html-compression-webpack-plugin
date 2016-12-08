# HTML compression plugin for webpack

## Info

The `compression-webpack-plugin` didn't compress HTML files. This plugin aims to solve that. Also added an option to remove the original assets after compressing.

## Usage

Credits to @sokra for the code from compression-webpack-plugin (https://github.com/webpack/compression-webpack-plugin)
Link to NPM: https://www.npmjs.com/package/html-compression-webpack-plugin

``` javascript
var HTMLCompressionPlugin = require("html-compression-webpack-plugin");
module.exports = {
	plugins: [
		new HTMLCompressionPlugin({
			testHTML: /\.html$/,
			test: /.*\.(css|js)$/i,
			deleteOriginals: true,
			assetsRelativeOutputDirectory: '../build/client/assets',
			asset: '[path].gz',
			algorithm: 'gzip',
			threshold: 0,
			minRatio: 0.0
	})
	]
}
```


Arguments:

* `asset`: The target asset name. `[file]` is replaced with the original asset. `[path]` is replaced with the path of the original asset and `[query]` with the query. Defaults to `"[path].gz[query]"`
* `assetsRelativeOutputDirectory`: The relative directory where your assets will be output to. Plugin will look in sub-folders for the original assets aswell.
* `algorithm`: Can be a `function(buf, callback)` or a string. For a string the algorithm is taken from `zlib` (or zopfli for `zopfli`). Defaults to `"gzip"`.
* `deleteOriginals`: All original assets which have been compressed will be deleted in the done phase. The stats after bundling will show the files emitted but they will be deleted. Defaults to `true`
* `test`: All assets matching this RegExp are processed. Defaults to `/.*\.(js|css)$/i`
* `testHTML`: All assets matching this RegExp are processed. This will happen in the emit phase. Defaults to `/\.html$/`
* `threshold`: Only assets bigger than this size are processed. In bytes. Defaults to `0`.
* `minRatio`: Only assets that compress better that this ratio are processed. Defaults to `0.8`.

Option Arguments for Zopfli (see [node-zopfli](https://github.com/pierreinglebert/node-zopfli#options) doc for details):
* verbose: Default: false,
* verbose_more: Default: false,
* numiterations: Default: 15,
* blocksplitting: Default: true,
* blocksplittinglast: Default: false,
* blocksplittingmax: Default: 15

## License

MIT (http://www.opensource.org/licenses/mit-license.php)