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

	var conversions = 
		JSON.parse(fs.readFileSync(options.configDir + '/conversions.json', 'utf8'));

	glob("tests.json/*.test.json", (err, files) => {
		files.forEach((file) => {
			fs.readFile(file, 'utf8', (err, data) => {
				if (err) throw err;
				var test = JSON.parse(data);
				var schema = JSON.parse(fs.readFileSync(options.schemasDir + '/' + test.schema, 'utf8'));
				preprocess(test, options, schema, (newSteps) => {
					test.steps = newSteps;
					var templateFile = options.templateDir + '/' + test.template;

					var languageCode = "";
					test.steps.forEach((step) => {
						languageCode += compile(conversions[step.type])(step.options) + '\n';
						if(test.hasOwnProperty("wait"))
							languageCode += compile(conversions['wait'])({wait: test.wait}) + '\n';
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

function preprocess (test, options, schema, cb) {
	var preprocessor = JSON.parse(fs.readFileSync(options.configDir + '/preprocessor.json', 'utf8'));

	var directives = {};
	var additions = [];

	test.steps.forEach((step, index) => {
		if (preprocessor.hasOwnProperty(step.type)) {
			var processorVars = processStep(step, preprocessor, schema);

			// memoize since we're blocking
			if (directives[step.type] == undefined)
				directives[step.type] = 
					fs.readFileSync(options.directivesDir + '/' + step.type + '.directive', 'utf8');
			
			var newSteps = JSON.parse(compile(directives[step.type])(processorVars))
			additions.push({steps: newSteps, originalPos: index});
		}
	});
	cb(insertSteps(test.steps, additions));
}

function insertSteps(steps, additions) {
	var offset = 0;
	additions.forEach((addition) => {
		steps = steps
			.slice(0, addition.originalPos + offset)
			.concat(addition.steps,
				    steps.slice(addition.originalPos + addition.steps.length + offset));
			offset += addition.steps.length;
	});
	return steps;
}

function processStep(step, preprocessor, schema) {
	var currentPP = preprocessor[step.type];

	var selectorOpts = {};
	if (step.options != undefined && step.options.selectors != undefined)
		selectorOpts = { selectors: step.options.selectors };

	var query = compile(currentPP.schemaSelector)(selectorOpts);
	var components = jp.query(schema, query);
	
	// if an object is unique it is a single component
	// otherwise it is an array of components
	var processorVars = {};
	if (currentPP.unique)
		currentPP.schemaProperties.forEach((data) => {
			processorVars[data] = components[0][data];
		});
	else
		processorVars.arr = components;

	return processorVars;	
}

exports.compilate();