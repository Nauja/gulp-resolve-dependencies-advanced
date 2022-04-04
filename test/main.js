var gulp = require('gulp'),
	fs = require('fs'),
	path = require('path'),
	es = require('event-stream'),
	assert = require('assert'),
	concat = require('gulp-concat'),
	resolveDependencies = require('gulp-resolve-dependencies'),
	advancedResolveDependencies = require('../');

function assertFilesEqual(file) {
	var result = path.join(__dirname, 'results', file);
	var expected = path.join(__dirname, 'expected', file);

	assert.strictEqual(
		fs.readFileSync(result, 'utf8'),
		fs.readFileSync(expected, 'utf8')
	);

	fs.unlinkSync(result);
	fs.rmdirSync(__dirname + '/results/');
}

describe('gulp-resolve-dependencies-advanced', function() {
	it('should resolve dependencies in external directories with advancedPathResolver', function(done) {
		gulp.src(__dirname + '/advanced/app/e.scss')
			.pipe(resolveDependencies({
				// Match @use 'name';
				pattern: /@use '(.*)';/g,
				resolvePath: advancedResolveDependencies.advancedPathResolver({
					paths: {
						"*": [
							__dirname + "/advanced/liba",
							__dirname + "/advanced/libb",
							// For libc directory
							__dirname + "/advanced"
						]
					},
					// .scss and .css are for allowing a.scss and b.css,
					// "" is for allowing libc directory
					extensions: [".scss", ".css", ""],
					// To resolve libc/index.scss
					mainFiles: ["index.scss"]
				})
			}))
			.pipe(concat('advanced.scss'))
			.pipe(gulp.dest(__dirname + '/results/'))
			.pipe(es.wait(function() {
				assertFilesEqual('advanced.scss');
				done();
			}));
	});
});
