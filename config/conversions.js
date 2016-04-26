exports.clickOn = function (options) {
	var output = "swinger.clickOn(matchingAll(";
	Object.keys(options.selectors).forEach(function(key) {
				output += '"' + key + ':' + options.selectors[key] + '", '
	})
	return output.slice(0, output.length - 2) + ");";
}