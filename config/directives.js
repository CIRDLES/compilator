exports.clickOnAll = function (options) {
	var retArr = [];
	options.arr.forEach(function (component) {
		var obj = {
			type: "clickOn",
			"options": {
				"selectors": { }
			}
		};
		obj.options.selectors.type = component.name;
		obj.options.selectors.text = component.label;
		retArr.push(obj)
	});
	return retArr;
}

exports.clickOnChildren = function (options) {
	var retArr = [];
	options.children.forEach(function (component) {
		var obj = {
			type: "clickOn",
			"options": {
				"selectors": { }
			}
		};
		obj.options.selectors.type = component.name;
		obj.options.selectors.text = component.label;
		retArr.push(obj)
	});
	return retArr;
}