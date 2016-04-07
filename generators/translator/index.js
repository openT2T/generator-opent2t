'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var xml2js = require('xml2js');
var extend = require('util')._extend;
var glob = require('glob');
var path = require('path');

var _parsedSchema = '';
var _parsedOnboarding = '';
var _stubFunctions = '';
var _stubOnboardingArgs = '';
var _globals = '';

// Gets schema file IDs and paths from a local repo, given a path to the repo
function getSchemaIdsAndPathsFromLocalRepo(localPath) {

  // first, get all xml files under the given path
  var paths = glob.sync(localPath + '/**/*.xml', {});

  // exclude manifest files
  paths = paths.filter(function(item) {
    return !item.endsWith('manifest.xml');
  });

  var idsToPaths = {};

  // The schema ID is the name of the schema file (without extension)
  // See: https://nodejs.org/api/path.html#path_path_parse_pathstring
  paths.forEach(function(element) {
    var key = path.parse(element).name;
    idsToPaths[key] = element;
  }, this);

  return idsToPaths;
};

module.exports = yeoman.generators.Base.extend({
  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);
    this.option('name', { type: String });
    this.option('nested', { type: Boolean, hide: true });

    this.props = {
      name: this.options.name,
      packageName: this.options.packageName
    };
  },

  prompting: function() {
    var done = this.async();

    if (!this.options.nested) {
      // Have Yeoman greet the user (unless this generator is being called from another).
      this.log(yosay(
        'Welcome to the ' + chalk.red('Open Translators to Things') + ' generator!'
      ));
    }

    // Ask the user about what schema and onboarding module they want to implement.

    // TODO: We should get these lists from the cloud, and then download the selected one locally.
    //       Temporarily getting the list from a locally synced repo.
    this.schemaIdsToPaths = getSchemaIdsAndPathsFromLocalRepo('../translators');
    this.onboardingModelIdsToPaths = getSchemaIdsAndPathsFromLocalRepo('../onboarding');

    var prompts = [
      {
        type: 'list',
        name: 'schema',
        message: 'What schema does this translator implement?',
        choices: Object.keys(this.schemaIdsToPaths)
      },
      {
        type: 'list',
        name: 'onboarding',
        message: 'What onboarding model does this translator implement?',
        choices: Object.keys(this.onboardingModelIdsToPaths)
      }
    ];

    this.prompt(prompts, function(props) {
      this.props = extend(this.props, props);
      this.props.schemaFilePath = this.schemaIdsToPaths[props.schema];
      this.props.onboardingFilePath = this.onboardingModelIdsToPaths[props.onboarding];

      done();
    }.bind(this));
  },

  xmlParsing: function() {
    var done = this.async();
    var fs = require('fs');
    var parser = new xml2js.Parser();

    var localProps = this.props;

    // Parse schema to generate stub functions
    var schemaFile = fs.readFileSync(this.props.schemaFilePath);
    parser.parseString(schemaFile, function(err, result) {
      if (err) {
        console.log(err.stack);
      } else {
        _parsedSchema = result;

        // We only handle one interface right now (the first one)
        var methods = _parsedSchema.node.interface[0].method;
        for (var i = 0; i < methods.length; i++) {
          var argString = '';
          var args = methods[i].arg;

          if (args) {
            for (var j = 0; j < args.length; j++) {
              argString += '/* [' + args[j].$.direction + '] ' + args[j].$.type + ' */ ' + args[j].$.name;
            }
            if (i < args.length - 1) {
              argString += ', ';
            }
          }

          // Create a stub function per method in the schema
          _stubFunctions +=
            '  ' + methods[i].$.name + ': function(' + argString + ') {\n' +
            '    console.log(\'' + methods[i].$.name + ' called.\');\n' +
            '  }';

          if (i < methods.length - 1) {
            _stubFunctions += ',\n\n';
          }

          // Create an export per method in the schema
          _globals += 'global.' + methods[i].$.name + ' = module.exports.' + methods[i].$.name + ';\n';
        }
      }

      // Next, Parse onboarding to generate stub onboarding values
      var onboardingFile = fs.readFileSync(localProps.onboardingFilePath);
      parser.parseString(onboardingFile, function(err, result) {
        if (err) {
          console.log(err.stack);
        } else {
          _parsedOnboarding = result;

          // Find all methods
          var methods = _parsedOnboarding.node.interface[0].method;
          for (var i = 0; i < methods.length; i++) {
            // look for all args of the onboarding method, and create stub properties
            if (methods[i].$.name.toLowerCase() === 'onboard') {
              var args = methods[i].arg;
              if (args) {
                for (var j = 0; j < args.length; j++) {
                  _stubOnboardingArgs += '\n    <arg name="' + args[j].$.name + '" value="" />';
                }
              }
            }
          }
        }

        // all done
        done();
      });
    });
  },

  writing: function() {
    this.props.stubFunctions = _stubFunctions;
    this.props.stubOnboardingArgs = _stubOnboardingArgs;
    this.props.globals = _globals;

    this.log('Writing files...');
    this.fs.copyTpl(
      this.templatePath('js/thingTranslator.js.template'),
      this.destinationPath('dist/js/thingTranslator.js'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('js/manifest.xml.template'),
      this.destinationPath('dist/js/manifest.xml'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('js/package.json.template'),
      this.destinationPath('dist/js/package.json'),
      { props: this.props }
    );

    this.log('package.json generated. OpenT2T translators use the MIT license.');
  }
});