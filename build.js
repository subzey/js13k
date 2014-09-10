#!/usr/bin/env node
var fs = require('fs');
var path = require('path');

var keep = ['start', 'startDemo', 'load', 'credits', 'mainMenu'];
var mangledNames = {};

var html = fs.readFileSync(path.join(__dirname, 'source.html'), 'utf-8');
html = html.replace(/\r\n/g, '\n');
html = html.replace(/(<script[^>]*>)([^]*?)(<\/script>)/g, function(_, openTag, content, closeTag){
	var uglifyjs;
	try {
		uglifyjs = require('uglify-js');
	} catch (e){
		console.error('Could not import uglifyjs. install is with `npm install`!');
		process.exit(1);
	}

	var keepCode = keep.map(function(varname){return ';window.__exported_' + varname + '=' + varname;}).join('');
	// Yes, I don't know how to set mangle=toplevel
	content = 'function __main(){' + content + keepCode + '}';

	var minified = uglifyjs.minify(content, {
		fromString: true,
		compress: {
			drop_console: true,
			drop_debugger: true,
			cascade: true,
			if_return: true
		},
		mangle: true
	}).code;

	// strip iife
	minified = minified.replace(/^[^]*function\s+__main[^]*?{(.*)\s*};?$/, '$1');
	// get minified names
	minified = minified.replace(/[;,]window.__exported_(\w+)\s*=\s*(\w+)/g, function(_, originalName, mangledName){
		mangledNames[originalName] = mangledName;
		return '';
	});

	return openTag + minified + closeTag;
});

html = html.replace(/(onclick=)((["']).*?\2|[^>\s*]*)/g, function(_, attr, onclickStr){
	for (var originalName in mangledNames){
		onclickStr = onclickStr.replace(new RegExp('\\b' + originalName + '\\b', 'g'), mangledNames[originalName]);
	}
	return attr + onclickStr;
});

fs.writeFileSync(path.join(__dirname, 'index.html'), html);