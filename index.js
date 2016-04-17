var fs = require('fs'),
	glob = require('glob'),
	compile = require('handlebars').compile,
	jp = require('jsonpath'),
	basename = require('path').basename,
	merge = require('merge');

exports.compilate = (options) => {
	var defaultOptions = {
		templateDir: 'templates',
		outDir: 'tests.out',
		configDir: 'config',
		directivesDir: 'config/directives',
		schemasDir: 'schemas',
		testDir: 'tests.json'
	};

	if (options == undefined) options = defaultOptions;
	else options = merge(defaultOptions, options);

	var conversions = JSON.parse(fs.readFileSync(options.configDir + '/conversions.json', 'utf8'));

	glob("tests.json/*.test.json", (err, files) => {
		files.forEach((file) => {
			fs.readFile(file, 'utf8', (err, data) => {
				if (err) throw err;
				var test = JSON.parse(data);
				var schema = JSON.parse(fs.readFileSync(options.schemasDir + '/' + test.schema, 'utf8'));
				preprocess(test.steps, schema, options, (newSteps) => {
					test.steps = newSteps;
					var templateFile = options.templateDir + '/' + test.template;

					var languageCode = "";
					test.steps.forEach((step) => {
						languageCode += compile(conversions[step.type])(step.options) + '\n';
					});

					fs.readFile(templateFile, 'utf8', (err, data) => {
						opts = {};
						opts[test.replaces] = languageCode;
						fs.writeFile(options.outDir + '/' + test.template, compile(data)(opts), (err) => {
							if (err) throw err;
						});
					});
				});
			})
		})
	});
};

function preprocess (steps, schema, options, cb) {
	var preprocessor = JSON.parse(fs.readFileSync(options.configDir + '/preprocessor.json', 'utf8'));
	steps.forEach((step, index) => {
		if (preprocessor.hasOwnProperty(step.type)) {
			var currentPP = preprocessor[step.type];

			var selectorOpts = {};
			if (step.hasOwnProperty("options") && step.options.hasOwnProperty("selectors"))
				selectorOpts = {selectors: step.options.selectors };

			var queryString = compile(currentPP.schemaSelector)(selectorOpts);
			var component = jp.query(schema, queryString);

			var processorVars = {};
			if (currentPP.hasOwnProperty('schemaProperties'))
				currentPP.schemaProperties.forEach((data) => {
					processorVars[data] = component[0][data]
				});
			else
				processorVars.arr = component;

			var ppDirectivePath = options.directivesDir + '/' + step.type + '.directive';
			fs.readFile(ppDirectivePath, 'utf8', (err, data) => {
				var newSteps = JSON.parse(compile(data)(processorVars));
				steps = steps.splice(0,index).concat(newSteps, steps.splice(index+1, steps.length));
				cb(steps);
			});
		}
	});
}