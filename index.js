'use strict';
/* eslint-env node */
var SassCompilerFactory = require('broccoli-sass-source-maps');
var LESSCompiler = require('broccoli-less-single');
var path = require('path');
var VersionChecker = require('ember-cli-version-checker');
var Funnel = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');


function Plugin(optionsFn) {
  this.name = 'ember-cli-sass-less';
  this.optionsFn = optionsFn;
  this.ext = ['scss', 'sass', 'less'];
}

Plugin.prototype.toTree = function(tree, inputPath, outputPath, inputOptions) {
  var sass = this.sassToTree(...arguments);
  var less = this.lessToTree(...arguments);
  return mergeTrees(sass.concat(less), inputOptions);
}

Plugin.prototype.lessToTree = function(tree, inputPath, outputPath, inputOptions) {
  let options = Object.assign(
    {
      cacheInclude: [/.*\.(css|less)$/],
    },
    this.optionsFn().lessOptions,
    inputOptions,
  );

  let inputExt = '.less';
  let paths = options.outputPaths || {
    app: options.registry.app.options.outputPaths.app.css, };
  let lessFiles = options.lessFiles || [];
  let lessSuffix = options.lessPrefix || inputExt;

  /* remove `registry` object we pass into Less */
  delete options.registry;

  let trees = Object.keys(paths).map(function (file) {
    if (lessFiles.includes(file)) {
      let input = path.join(inputPath, file + inputExt);
      let filePath = paths[file];
      let dir = path.dirname(filePath) 
      let ext = path.extname(filePath);
      let name = path.basename(filePath, ext)
      let output = path.join('/', dir, name + lessSuffix + ext);
      return new LESSCompiler([tree], input, output, options);
    }
  }).filter(t => t);

  return trees;
};

Plugin.prototype.sassToTree = function(tree, inputPath, outputPath, inputOptions) {
  var options = Object.assign({}, this.optionsFn().sassOptions, inputOptions);
  var inputTrees;

  if (options.onlyIncluded) {
    inputTrees = [new Funnel(tree, {
      include: ['app/styles/**/*'],
      annotation: 'Funnel (styles)'
    })];
  }
  else {
    inputTrees = [tree];
  }

  if (options.includePaths) {
    inputTrees = inputTrees.concat(options.includePaths);
  }

  if (!options.implementation) {
    try {
      // eslint-disable-next-line node/no-unpublished-require
      options.implementation = require('sass');
    } catch (e) {
      var error = new Error(
        'Could not find the default SASS implementation. Run the default blueprint:\n' +
        '   ember g ember-cli-sass-less\n' +
        'Or install an implementation such as "node-sass" and add an implementation option. For example:\n' +
        '   sassOptions: {implementation: require("node-sass")}');
      error.type = 'Sass Plugin Error';

      throw error;
    }
  }

  var SassCompiler = SassCompilerFactory(options.implementation);
  var ext = options.extension || 'scss';
  var paths = options.outputPaths;
  var excludeFiles = options.excludeFiles || [];
  var trees = Object.keys(paths).map(function(file) {
    if (!excludeFiles.includes(file)) {
      var input = path.join(inputPath, file + '.' + ext);
      var output = paths[file];
      return new SassCompiler(inputTrees, input, output, options);
    }
  }).filter(t => t);

  if (options.passthrough) {
    trees.push(new Funnel(tree, options.passthrough));
  }
  return trees;
};

module.exports = {
  name:  'ember-cli-sass-less',

  shouldSetupRegistryInIncluded: function() {
    let checker = new VersionChecker(this);
    return !checker.for('ember-cli').isAbove('0.2.0');
  },

  sassOptions: function () {
    var env  = process.env.EMBER_ENV;
    var envConfig = this.project.config(env).sassOptions;

    var app = this.app;
    var parent = this.parent;
    var hostApp = typeof this._findHost === 'function' ? this._findHost() : undefined;

    // *Either* use the options for an addon which is consuming this, *or* for
    // an app which is consuming this, but never *both* at the same time. The
    // special case here is when testing an addon.
    // In lazy loading engines, the host might be different from the parent, so we fall back to that one
    var options = (app && app.options && app.options.sassOptions)
      || (parent && parent.options && parent.options.sassOptions)
      || (hostApp && hostApp.options && hostApp.options.sassOptions)
      || {};

    if (envConfig) {
      console.warn("Deprecation warning: sassOptions should be moved to your ember-cli-build"); // eslint-disable-line
      Object.assign(options, envConfig);
    }

    if ((options.sourceMap === undefined) && (env == 'development')) {
      options.sourceMap = true;
    }

    if (options.sourceMap || options.sourceMapEmbed) {
      // we need to embed the sourcesContent in the source map until libsass has better support for broccoli-sass
      options.sourceMapContents = true;
    }

    options.outputFile = options.outputFile || this.project.name() + '.css';
    options.sourceMapRoot = path.join(this.project.root, 'app/styles');

    return options;
  },

  lessOptions: function () {
    let env = process.env.EMBER_ENV;
    let app = this.app;

    // fix issue with nested addons, in which case our app.options hash is actually on app.app.options.
    // n.b. this can be removed once ember-cli better supports nested addons.
    //   (see https://github.com/gdub22/ember-cli-less/issues/36)
    if (app && !app.options && app.app) {
      app = app.app;
    }

    let options = (app && app.options && app.options.lessOptions) || {};

    if (options.sourceMap === undefined && env === 'development') {
      options.sourceMap = true;
    }

    return options;
  },

  setupPreprocessorRegistry: function(type, registry) {
    registry.add('css', new Plugin((function() {
      return {
        sassOptions: this.sassOptions.call(this),
        lessOptions: this.lessOptions.call(this)
      }
    }).bind(this)));

    // prevent conflict with broccoli-sass if it's installed
    if (registry.remove) registry.remove('css', 'broccoli-sass');
  },

  included: function included(app) {
    this._super.included.apply(this, arguments);

    // see: https://github.com/ember-cli/ember-cli/issues/3718
    if (typeof app.import !== 'function' && app.app) {
      app = app.app;
    }

    this.app = app;

    if (this.shouldSetupRegistryInIncluded()) {
      this.setupPreprocessorRegistry('parent', app.registry);
    }
  }
};
