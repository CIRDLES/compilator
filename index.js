var fs = require('fs-promise'),
	compile = require('handlebars').compile,
	jp = require('jsonpath'),
	basename = require('path').basename,
	merge = require('merge'),
	promise = require('promise'),
	glob = require('glob-fs')({ gitignore: true }),
	ejs = require('ejs'),
	pp = require('./config/preprocessor');
	cc = require ('./config/conversions')


var defaults = JSON.parse(fs.readFileSync('config/defaults.json', 'utf8'));

exports.compilate = (options) => {
	if (options == undefined) options = defaults;
	else options = merge(defaults, options);

	glob.readdirPromise(options.testDir + '/*.test.json')
	.then(function(files) {
		files.forEach(function (file) {
			fs.readFile(file, 'utf8')
			.then(function (contents, err) {
				if (err) throw err;
				var test = JSON.parse(contents);
				var schema = JSON.parse(fs.readFileSync(options.schemasDir + '/' + test.schema, 'utf8'));
				// preprocess all defined directives
				preprocess(test, options, schema).then(function (newSteps) {
					// the newly generated steps
					test.steps = newSteps;

					var languageCode = "";
					var conversions = 
						JSON.parse(fs.readFileSync('config/conversions.json', 'utf8'));

					// compile each step into language-specific code
					test.steps.forEach(function (step) {
						if (conversions[step.type] == '<>') {
							console.log(cc[step.type](step.options))
							languageCode += cc[step.type](step.options) + '\n';
						} else {
							languageCode += compile(conversions[step.type])(step.options) + '\n';
						}

						// interleave waits
						if(test.hasOwnProperty("wait"))
							languageCode += compile(conversions['wait'])({wait: test.wait}) + '\n';
					});

					// combine with template and write to file
					var templateFile = options.templateDir + '/' + test.template;
					fs.readFile(templateFile, 'utf8')
					.then(function(contents, err) {
						if (err) throw err;

						var opts = {};
						opts[test.replaces] = languageCode;

						fs.writeFile(options.outDir + '/' + test.template, compile(contents)(opts))
						.then(function(err)  {
							if (err) throw err;
						});
					});
				});
			})
		})
	});
};

function preprocess (test, options, schema) {
	return new Promise(function (fulfill, reject) {
		var preprocessor = JSON.parse(fs.readFileSync('config/preprocessor.json', 'utf8'));
		var directives = {};
		var additions = [];

		test.steps.forEach(function(step, index) {
			// check if step is a directive
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
		fulfill(insertSteps(test.steps, additions));
	});
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

	var query = null;
	if (currentPP.schemaSelector !== '<>') {
		query = compile(currentPP.schemaSelector)(selectorOpts);
	} else {
		query = pp[step.type](selectorOpts)
	}
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
