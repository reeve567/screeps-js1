module.exports = function (grunt) {
	var currentDate = new Date();

	grunt.loadNpmTasks("grunt-screeps");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-file-append");
	grunt.loadNpmTasks("grunt-rsync");

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		login: grunt.file.readJSON("login.json"),
		screeps: {
			options: {
				email: "<%= login.email %>",
				token: "<%= login.token %>",
				branch: "default",
				//server: "<%= login.server %>",
			},
			dist: {
				src: ["dist/*.js"],
			},
		},
		clean: {
			dist: ["dist"],
		},
		copy: {
			screeps: {
				files: [
					{
						expand: true,
						cwd: "src/",
						src: "**",
						dest: "dist/",
						filter: "isFile",
						rename: function (dest, src) {
							return dest + src.replace(/\//g, "_");
						},
					},
				],
			},
		},
		file_append: {
			versioning: {
				files: [
					{
						append: "\nglobal.SCRIPT_VERSION = " + currentDate.getTime() + "\n",
						input: "dist/version.js",
					},
				],
			},
		},
	});

	// Replace the imports for flattening
	let ReplaceImports = function (abspath, rootdir, subdir, filename) {
		if (abspath.match(/.js$/) == null) {
			return;
		}
		let file = grunt.file.read(abspath);
		let updatedFile = "";

		let lines = file.split("\n");
		for (let line of lines) {
			// Compiler: IgnoreLine
			if (line.match(/[.]*\/\/ Compiler: IgnoreLine[.]*/)) {
				continue;
			}
			let reqStr = line.match(/(?:require\(")([^_a-zA-Z0-9]*)([^"]*)/);
			if (reqStr && reqStr != "") {
				let reqPath = subdir ? subdir.split("/") : []; // relative path
				let upPaths = line.match(/\.\.\//gi);
				if (upPaths) {
					for (let i in upPaths) {
						reqPath.splice(reqPath.length - 1);
					}
				} else {
					let isRelative = line.match(/\.\//gi);
					if (!isRelative || isRelative == "") {
						// absolute path
						reqPath = [];
					}
				}

				let rePathed = "";
				if (reqPath && reqPath.length > 0) {
					while (reqPath.length > 0) {
						rePathed += reqPath.shift() + "_";
					}
				}
				line = line.replace(/require\("([\.\/]*)([^"]*)/, 'require("' + rePathed + "$2").replace(/\//gi, "_");
			}

			updatedFile += line + "\n";
		}

		grunt.file.write(rootdir + "/" + (subdir ? subdir + "/" : "") + filename, updatedFile);
	};

	grunt.registerTask("replace", "Replaces file paths with _", function () {
		grunt.file.recurse("./dist", ReplaceImports);
	});

	// Default task(s).
	grunt.registerTask("default", ["clean", "copy:screeps", "file_append:versioning", "replace", "screeps"]);
};
