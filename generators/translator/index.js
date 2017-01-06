'use strict';

const packagePrefix = 'opent2t-translator-com-';
var yeoman = require('yeoman-generator');
var path = require('path');
var chalk = require('chalk');
var glob = require('glob');
var raml = require('raml-1-parser');
var packageNameValidate = require("validate-npm-package-name");
var utils = require('./../utilities');

function getSchemaMethods(ramlPath) {
  var ramlMethods = [];

  function methodExists(methodName) {
    for (var i = 0; i < ramlMethods.length; i++) {
      if (ramlMethods[i].name === methodName) {
        return true;
      }
    }

    return false;
  }

  function addMethod(methodName) {
    if (!methodExists(methodName)) {
      var params = '';
      var callee = '// Add implementation';
      if (methodName === 'get') {
        params = 'expand, payload';
      }

      if (methodName.startsWith('getDevices') || methodName.startsWith('postDevices')) {
        if (methodName.startsWith('getDevices')) {
          params = 'deviceId';
          let resource = methodName.replace('getDevices', '');
          resource = resource.charAt(0).toLowerCase() + resource.slice(1);
          callee = 'return this.getDeviceResource(deviceId, \'' + resource + '\');';
        } else {
          params = 'deviceId, payload';
          let resource = methodName.replace('postDevices', '');
          resource = resource.charAt(0).toLowerCase() + resource.slice(1);
          callee = 'return this.postDeviceResource(deviceId, \'' + resource + '\', payload);';
        }
      }
      ramlMethods.push({ name: methodName, params: params, callee: callee });
    }
  }

  if (ramlPath) {
    var resources = [];
    raml.loadApiSync(ramlPath).resources().forEach(r => {
      resources.push(r);
    });

    while (resources.length > 0) {
      var current = resources.shift();
      var resourceParts = current.completeRelativeUri().substring(1).split('/');
      var suffix = '';

      resourceParts.forEach(part => {
        { }
        if (!part.startsWith('{') && !part.startsWith('?')) {
          suffix += part.charAt(0).toUpperCase() + part.slice(1);
        }
      });

      current.is().forEach(trait => {
        var traitName = trait.name();
        if (traitName === 'interface-sensor') {
          addMethod('get' + suffix);
        }
        else if (traitName === 'interface-actuator') {
          addMethod('get' + suffix);
          addMethod('post' + suffix);
        }
      });

      current.methods().forEach(method => {
        addMethod(method.method() + suffix);
      });

      current.resources().forEach(child => {
        resources.push(child);
      });
    }
  }

  return ramlMethods;
}

module.exports = yeoman.Base.extend({
  constructor: function () {
    yeoman.Base.apply(this, arguments);
    this.option('repoRoot');
    this.option('hub');
    this.option('schema');

    this.env.options['schema'] = this.options['schema'];

    this.props = {
      hub: this.options.hub
    };
  },

  prompting: function () {
    var prompts = [
      {
        type: 'input',
        name: 'deviceFriendlyName',
        message: 'What is the human-readable name of the thing you are writing a translator for (e.g. Binary Switch)? ',
        validate: utils.validateNotEmpty('Please enter a valid translator name.')
      },
      {
        type: 'input',
        name: 'packageName',
        message: 'What is the node package name you want to use (e.g. opent2t-translator-com-contoso-binaryswitch)? ',
        validate: function (input) {
          var pass = input.toLowerCase().startsWith(packagePrefix) && packageNameValidate(input).validForNewPackages;
          if (pass) {
            return true;
          }
          return 'Please enter a valid package name. It must start with ' + packagePrefix + ' and should adhere to the requirements for node package names.';
        }
      }
    ];

    var knownSchema = this.env.options['schema'] !== undefined;

    if (!knownSchema) {
      var paths = glob.sync('{./dest/**,' + this.options.repoRoot + '/org.opent2t.sample.!(hub).superpopular}/*.raml', {});

      prompts.push(
        {
          type: 'rawlist',
          name: 'schemaName',
          message: 'Which schema does the device use?',
          choices: paths.map(p => path.parse(p).name)
        }
      );
    }

    this.log(chalk.blue('\nDefine Translator\n'));

    return this.prompt(prompts).then(function (props) {
      var schema;
      var ramlPath;

      if (knownSchema) {
        ramlPath = this.env.options['schema'];
        schema = path.basename(ramlPath, '.raml');
      } else {
        schema = props.schemaName;
        ramlPath = path.join(this.options.repoRoot, schema, schema + '.raml');
      }

      this.props.packageName = props.packageName;
      this.props.hubPackageName = packagePrefix + this.props.hub.lowerName + '-hub';
      this.props.schemaName = schema;
      this.props.schemaMethods = getSchemaMethods(ramlPath);
      this.props.device = utils.createDeviceInfo(props.deviceFriendlyName);
    }.bind(this));
  },

  writing: function () {
    var destRoot = 'dest/com.' + this.props.hub.lowerName + '.' + this.props.device.lowerName;
    this.fs.copyTpl(
      this.templatePath('js/thingTranslator.js.template'),
      this.destinationPath(destRoot + '/js/thingTranslator.js'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('js/manifest.xml.template'),
      this.destinationPath(destRoot + '/js/manifest.xml'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('js/package.json.template'),
      this.destinationPath(destRoot + '/js/package.json'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('js/README.md.template'),
      this.destinationPath(destRoot + '/js/README.md'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('js/tests/test.js.template'),
      this.destinationPath(destRoot + '/js/tests/test.js'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('js/tests/unitTests.js.template'),
      this.destinationPath(destRoot + '/js/tests/unitTests.js'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('js/tests/devicedata.json.template'),
      this.destinationPath(destRoot + '/js/tests/devicedata.json'),
      { props: this.props }
    );
  }
});
