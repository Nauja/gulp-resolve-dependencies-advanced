'use strict';

var fs = require('fs'),
	path = require('path'),
	merge = require('lodash.merge'),
	glob = require('glob'),
	minimatch = require('minimatch');

/**
 * Default path resolver.
 * 
 * Return a matched dependency relative to the targetFile.
 * 
 * @param {string} match - Matched dependency
 * @param {object} targetFile - Vinyl file
 * @returns {string} - Path to dependency
 */
 function relativePathResolver(match, targetFile) {
	return path.join(path.dirname(path.resolve(targetFile.path)), match);
}

/**
 * Build a regex for matching multiple extensions with glob.
 * 
 * A single extension is returned unmodified:
 * 
 * 	joinExtensionsForGlob([".ext"]) => ".ext"
 * 	joinExtensionsForGlob(["*"]) => "*"
 * 
 * Multiple extensions are joined together in a regex:
 * 
 * 	joinExtensionsForGlob([".ext1", ".ext2", "*"]) => "+(.ext1|.ext2|*)"
 *
 * @param {Array} extensions - List of [".ext1", ".ext2", ...]
 * @returns {string} - "+(.ext1|.ext2|...)" regex
 */
function joinExtensionsForGlob(extensions)
{
	if (!extensions || extensions.length === 0) {
		return "";
	}

	if (extensions.length === 1) {
		// Single extension => no need for ".+"
		return extensions[0];
	}

	// Multiple extensions => build "+(.ext1|.ext2|...)"
	return "+(" + extensions.join("|") + ")"
}

/**
 * Find files or directories matching "filePath + extensions".
 * 
 * This is the same as searching files and directories with:
 * 
 * 	glob.sync(path + extension)
 * 
 * @param {string} filePath - Directory or file glob with or without extension
 * @param {string} extensions - List of extensions to test
 * @returns {Array} - Results of glob.sync
 */
function globWithExtensionsSync(filePath, extensions)
{
	// Check if filePath has extension
	var ext = path.extname(filePath);
	if (ext) {
		// Reject custom extensions
		extensions = [];
	}

	// Find all directories and files matching filePath + extensions glob
	return glob.sync(filePath + joinExtensionsForGlob(extensions));
}

/**
 * Advanced path resolver.
 * 
 * Can search for matched dependency in a list of external
 * directories and with multiple extensions.
 * 
 * @param {object} config - Resolver configuration
 * @returns {any} - Resolver function
 */
function advancedPathResolver(config) {
	var defaults = {
		paths: {},
		extensions: [],
		mainFiles: []
	};

	// Set default values
	config = merge(defaults, config);

	function findFile(match, targetFile) {
		// Try to resolve path in external directories
		if (config.paths) {
			for (var pattern of Object.keys(config.paths)) {
				// Does dependency match glob
				if (!minimatch(match, pattern)) {
					continue;
				}

				// Search in directories
				for(var dir of config.paths[pattern]) {
					var files = globWithExtensionsSync(path.join(dir, match), config.extensions);
					if (files && files.length !== 0) {
						return files[0];
					}
				}
			}
		}

		// Try to resolve path relative to targetFile
		var filePath = relativePathResolver(match, targetFile);
		var files = globWithExtensionsSync(filePath, config.extensions);
		if(files && files.length !== 0) {
			return files[0];
		}

		// Fallback to default resolver
		return filePath;
	}

	return (match, targetFile) => {
		// Find the best match for configuration
		var filePath = findFile(match, targetFile);

		// File doesn't exist, stop here
		if (!fs.existsSync(filePath)) {
			return filePath;
		}

		// File isn't a directory, stop here
		var stat = fs.lstatSync(filePath, {throwIfNoEntry: false});
		if (stat === undefined || !stat.isDirectory) {
			return filePath;
		}

		// Try to find the main file
		if (config.mainFiles) {
			for (var mainFile of config.mainFiles) {
				var mainFilePath = path.join(filePath, mainFile);

				if (fs.existsSync(mainFilePath)) {
					return mainFilePath;
				}
			}
		}

		// Fallback to filePath
		return filePath;
	}
}

function advancedResolveDependencies() {

};

advancedResolveDependencies.relativePathResolver = relativePathResolver;
advancedResolveDependencies.advancedPathResolver = advancedPathResolver;
module.exports = advancedResolveDependencies;