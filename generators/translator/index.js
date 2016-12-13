'use strict';

var yeoman = require('yeoman-generator');
var extend = require('util')._extend;
var fs = require('fs');
var path = require('path');
var raml = require('raml-1-parser');
const packagePrefix = 'opent2t-translator-com-';
var defaultHubName;

function getSchemaMethods(ramlPath) {

  function addMethod(methodName) {
    if(ramlMethods.indexOf(methodName) === -1) {
      var params = '';
      var callee = '// Add implementation';
      if(methodName === 'get') {
        params = 'extend, payload'
      } 
      
      if(methodName.startsWith('getDevices') || methodName.startsWith('postDevices')) {
        if(methodName.startsWith('getDevices')) {
          params = 'deviceId';
          let resource = methodName.replace('getDevices', '');
          resource = resource.charAt(0).toLowerCase() + resource.slice(1);
          callee = 'return this.getDeviceResource(deviceId, \'' + resource + '\'");';
        } else {
          params = 'deviceId, payload';
          let resource = methodName.replace('postDevices', '');
          resource = resource.charAt(0).toLowerCase() + resource.slice(1);
          callee = 'return this.postDeviceResource(deviceId, \'' + resource + '\', payload);';
        }
      }
      ramlMethods.push({name: methodName, params: params, callee: callee});
    }
  }

  var ramlMethods = [];

  if(ramlPath) {
    var resources = [];
    raml.loadApiSync(ramlPath).resources().forEach(r => {
      resources.push(r);
    });

    while(resources.length > 0) {
      var current = resources.shift();
      var resourceParts = current.completeRelativeUri().substring(1).split("/");
      var suffix = "";

      resourceParts.forEach(part => {{}
        if(!part.startsWith("{") && !part.startsWith("?")){
          suffix += part.charAt(0).toUpperCase() + part.slice(1);
        }
      });

      current.is().forEach(trait => {
        var traitName = trait.name();
        if(traitName === "interface-sensor") {
          addMethod("get" + suffix);
        }
        else if(traitName === "interface-actuator") {
          addMethod("get" + suffix);
          addMethod("post" + suffix);
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
    this.option('hubName');
    this.option('schema');
    this.option('hubFriendlyName');

    this.props = {
      hubName: this.options.hubName,
      schema: this.options.schema,
      hubFriendlyName: this.options.hubFriendlyName
    };

    var hubName = this.props.hubName;

    if (this.props.hubFriendlyName === undefined) {
      defaultHubName = hubName.charAt(0).toUpperCase() + hubName.slice(1);
    }

    var deviceName = this.props.schema.value.replace('org.opent2t.sample.', '').replace('.superpopular', '');
    this.props.deviceNameLow = deviceName.toLowerCase();
    this.props.deviceFriendlyName = deviceName.charAt(0).toUpperCase() + deviceName.slice(1);
    this.props.deviceName = deviceName;
    this.props.packageName = packagePrefix + hubName + '-' + this.props.deviceNameLow;
    this.props.dirName = 'com.' + hubName + '.' + this.props.deviceNameLow;    this.props.
    this.props.hubPackageName = packagePrefix + hubName + '-hub';
    
    var ramlPath = path.join(this.options.repoRoot, this.props.schema.value, this.props.schema.value + '.raml');
    this.props.schemaMethods = getSchemaMethods(ramlPath);
  },

  prompting: function () {
    var prompts = [
      {
        when: function () {
          return defaultHubName !== undefined;
        },
        type: 'input',
        name: 'hubFriendlyName',
        message: 'What is the friendly name of the hub?',
        default: defaultHubName
      },
      {
        type: 'input',
        name: 'deviceFriendlyName',
        message: 'What is the friendly name of the device?',
        default: this.props.deviceFriendlyName
      },
      {
        type: 'input',
        name: 'packageName',
        message: 'What is the name of the translator node package?',
        default: this.props.packageName,
        validate: function (input) {
          var pass = input.toLowerCase().startsWith(packagePrefix);
          if (pass) {
            return true;
          }
          return 'Please enter a valid package name. It must start with ' + packagePrefix + ' and should adhere to the requirements for node package names.';
        }
      }
    ];

    return this.prompt(prompts).then(function (props) {
      this.props = extend(this.props, props);
    }.bind(this));
  },

  writing: function () {
    var destRoot = 'dest/' + this.props.dirName;
    this.fs.copyTpl(
      this.templatePath('js/thingTranslator.js.template'),
      this.destinationPath(destRoot + '/js/thingTranslator.js'),
      {props: this.props}
    );
    this.fs.copyTpl(
      this.templatePath('js/manifest.xml.template'),
      this.destinationPath(destRoot + '/js/manifest.xml'),
      {props: this.props}
    );
    this.fs.copyTpl(
      this.templatePath('js/package.json.template'),
      this.destinationPath(destRoot + '/js/package.json'),
      {props: this.props}
    );
    this.fs.copyTpl(
      this.templatePath('js/README.md.template'),
      this.destinationPath(destRoot + '/js/README.md'),
      {props: this.props}
    );
    this.fs.copyTpl(
      this.templatePath('js/tests/test.js.template'),
      this.destinationPath(destRoot + '/js/tests/test.js'),
      {props: this.props}
    );
    this.fs.copyTpl(
      this.templatePath('js/tests/devicedata.json.template'),
      this.destinationPath(destRoot + '/js/tests/devicedata.json'),
      {props: this.props}
    );
  }
});
