exports.clickOnChildren = function(options) {
	var output = "$..children[?(";
	Object.keys(options.selectors).forEach(function(key) {
				output += '@.' + key + '=="' + options.selectors[key] + '" && '
	})
	return output.slice(0, output.length - 4) + ")]";
}