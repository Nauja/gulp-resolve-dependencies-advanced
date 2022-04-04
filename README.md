# gulp-resolve-dependencies-advanced
[![build status](https://github.com/Nauja/gulp-resolve-dependencies-advanced/actions/workflows/nodejs.yml/badge.svg)](https://github.com/Nauja/gulp-resolve-dependencies-advanced/actions/workflows/nodejs.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

This library aims to add some extra features to [gulp-resolve-dependencies](backflip/gulp-resolve-dependencies).

It all started when I [needed](https://github.com/backflip/gulp-resolve-dependencies/pull/22) the library to be able to:
  * Resolve dependencies from external directories (i.e. node_modules)
  * Resolve dependencies without an explicit extension (i.e. `import React from "react";`)

## Usage

First, install `gulp-resolve-dependencies-advanced` as a development dependency:

```shell
npm install --save-dev gulp-resolve-dependencies-advanced
```

Import `gulp-resolve-dependencies` as usual and override the `resolvePath` option to use `advancedPathResolver` which implements an advanced strategy for resolving paths:

```javascript
var resolveDependencies = require('gulp-resolve-dependencies');
var advancedResolveDependencies = require('gulp-resolve-dependencies-advanced');
var concat = require('gulp-concat');

gulp.task('resolve-dependencies', function(){
  gulp.src(['./src/components/main.tsx'])
    .pipe(resolveDependencies({
      pattern: /import .* \"(.*)\";/g, // Accept import without explicit extension
      resolvePath: advancedResolveDependencies.advancedPathResolver({
        paths: {
          "*": [path.resolve(__dirname, "node_modules")] // Resolve files in node_modules
        },
        extensions: [".tsx", ".jsx", ".ts", ""],
        mainFiles: [
          "index.jsx",
          "index.tsx",
          "index.js",
          "index.ts"
        ]
      }),
      exclude: [
        path.resolve(__dirname, "node_modules/**/*"),
        path.resolve(__dirname, "src/**/utils.ts")
      ]
    }))
    .on('error', function(err) {
      console.log(err.message);
    })
    .pipe(concat())
    .pipe(gulp.dest('dest/assets/js/'));
});
```

## Testing

```bash
$ git clone https://github.com/Nauja/gulp-resolve-dependencies-advanced.git
$ cd gulp-resolve-dependencies-advanced
$ npm install
$ npm test
```

## License

Licensed under the [MIT](LICENSE) License.
