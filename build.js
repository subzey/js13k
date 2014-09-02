#!/usr/bin/env node
var fs = require('fs');
var path = require('path')
var html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
html = html.replace(/(<script[^>]*>)([^]*?)(<\/script>)/g, function(_, openTag, content, closeTag){
	var uglifyjs;
	try {
		uglifyjs = require('uglifyjs');
	} catch (e){
		console.error('Could not import uglifyjs. install is with `npm install`!');
		process.exit(1);
	}

	return openTag + uglifyjs.minify(content, {
		fromString: true,
		drop_console: true,
		cascade: true,
		if_return: true
	}).code + closeTag;
});

try {
	fs.mkdirSync(path.join(__dirname, 'build'));
} catch (e){}

fs.writeFileSync(path.join(__dirname, 'build', 'index.html'), html);