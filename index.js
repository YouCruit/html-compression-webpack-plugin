/*
MIT License http://www.opensource.org/licenses/mit-license.php
Author Tobias Koppers @sokra
Co-author Tom De Backer @TomDeBacker
*/

var async = require("async");
var url = require('url');
var fs = require('fs');
var path = require('path');

var RawSource = require("webpack-sources/lib/RawSource");

function HTMLCompressionPlugin(options) {
	options = options || {};
	this.asset = options.asset || "[path].gz[query]";
	this.algorithm = options.algorithm || "gzip";
	this.compressionOptions = {};
	if(typeof this.algorithm === "string") {
		if (this.algorithm === "zopfli") {
			try {
				var zopfli = require("node-zopfli");
			} catch(err) {
				throw new Error("node-zopfli not found");
			}
			this.compressionOptions = {
				verbose: options.hasOwnProperty('verbose') ? options.verbose : false,
				verbose_more: options.hasOwnProperty('verbose_more') ? options.verbose_more : false,
				numiterations: options.numiterations ? options.numiterations : 15,
				blocksplitting: options.hasOwnProperty('blocksplitting') ? options.blocksplitting : true,
				blocksplittinglast: options.hasOwnProperty('blocksplittinglast') ? options.blocksplittinglast : false,
				blocksplittingmax: options.blocksplittingmax ? options.blocksplittingmax : 15
			};
			this.algorithm = function (content, options, fn) {
				zopfli.gzip(content, options, fn);
			};
		} else {
			var zlib = require("zlib");
			this.algorithm = zlib[this.algorithm];
			if(!this.algorithm) throw new Error("Algorithm not found in zlib");
			this.compressionOptions = {
				level: options.level || 9,
				flush: options.flush,
				chunkSize: options.chunkSize,
				windowBits: options.windowBits,
				memLevel: options.memLevel,
				strategy: options.strategy,
				dictionary: options.dictionary
			};
		}
	}
	this.testHTML = options.testHTML ||  /\.html$/
	this.test = options.test || /.*\.(js|css)$/i
	this.threshold = options.threshold || 0;
	this.minRatio = options.minRatio || 0.8;
	this.deleteOriginals = options.deleteOriginals || true
	this.assetsRelativeOutputDirectory = options.assetsRelativeOutputDirectory
	this.originalAssetsPaths = new Array();
	if(!this.assetsRelativeOutputDirectory && this.deleteOriginals) 
		throw new Error('Set relative output directory of assets when enabling deletion of original files');
}
module.exports = HTMLCompressionPlugin;

HTMLCompressionPlugin.prototype.apply = function(compiler) {
	compiler.plugin("this-compilation", function(compilation) {
		compilation.plugin('optimize-assets', function(assets, callback) {
			async.forEach(Object.keys(assets), function(file, callback) {
				if(Array.isArray(this.test)) {
					if(this.test.every(function(t) {
						return !t.test(file);
					})) return callback();
				} else if(this.test && !this.test.test(file))
				return callback();
				var asset = assets[file];
				var content = asset.source();
				if(!Buffer.isBuffer(content))
					content = new Buffer(content, "utf-8");
				var originalSize = content.length;
				if(originalSize < this.threshold) return callback();
				this.algorithm(content, this.compressionOptions, function(err, result) {
					if(err) return callback(err);
					if(result.length / originalSize > this.minRatio) return callback();
					var parse = url.parse(file);
					var sub = {
						file: file,
						path: parse.pathname,
						query: parse.query || ""
					};
					var newFile = this.asset.replace(/\[(file|path|query)\]/g, function(p0,p1) {
						return sub[p1];
					});
					if(this.deleteOriginals === true){
						this.originalAssetsPaths.push(path.join(__dirname, this.assetsRelativeOutputDirectory, file));
					}
					assets[newFile] = new RawSource(result);
					callback();
				}.bind(this));
			}.bind(this), callback);
		}.bind(this));
	}.bind(this));
	compiler.plugin('emit', function(compilation, callback) {
		async.forEach(Object.keys(compilation.assets), function(file, callback) {
			if(Array.isArray(this.testHTML)) {
				if(this.testHTML.every(function(t) {
					return !t.test(file);
				})) return callback();
			} else if(this.testHTML && !this.testHTML.test(file))
			return callback();
			var asset = compilation.assets[file];
			var content = asset.source();
			if(!Buffer.isBuffer(content))
				content = new Buffer(content, "utf-8");
			var originalSize = content.length;
			if(originalSize < this.threshold) return callback();
			this.algorithm(content, this.compressionOptions, function(err, result) {
				if(err) return callback(err);
				if(result.length / originalSize > this.minRatio) return callback();
				var parse = url.parse(file);
				var sub = {
					file: file,
					path: parse.pathname,
					query: parse.query || ""
				};
				var newFile = this.asset.replace(/\[(file|path|query)\]/g, function(p0,p1) {
					return sub[p1];
				});
				if(this.deleteOriginals === true){
					this.originalAssetsPaths.push(path.join(__dirname, this.assetsRelativeOutputDirectory, file));
				}
				compilation.assets[newFile] = new RawSource(result);
				callback();
			}.bind(this));
		}.bind(this), callback);
	}.bind(this));
	compiler.plugin('done', function(stats) {
		for (var i in this.originalAssetsPaths) {
			fs.unlink(this.originalAssetsPaths[i]);
		}
	}.bind(this));
};