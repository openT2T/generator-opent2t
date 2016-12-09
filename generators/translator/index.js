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
      ramlMethods.push(methodName);
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

      resourceParts.forEach(part => {
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
    this.props.deviceFriendlyName = deviceName.charAt(0).toUpperCase() + deviceName.slice(1);
    this.props.packageName = packagePrefix + hubName + '-' + deviceName.toLowerCase();
    this.props.hubPackageName = packagePrefix + hubName + '-hub';

    //console.log("ROOT: " + this.options.repoRoot);
    var ramlPath = path.join(this.options.repoRoot, this.props.schema.value, this.props.schema.value + '.raml');
    // console.log("RP: " + ramlPath);
    // if(fs.existsSync(ramlPath)) {
    //     console.log("EXISTS");
    // }
    // else {
    //     console.log("NOT EXISTS");
    // }

    this.props.schemaMethods = getSchemaMethods(ramlPath);
    // schemaMethods.forEach(method => {
    //   console.log(method);
    // });
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
    this.fs.copyTpl(
      this.templatePath('js/thingTranslator.js.template'),
      this.destinationPath('dist/js/thingTranslator.js'),
      {props: this.props}
    );
    this.fs.copyTpl(
      this.templatePath('js/manifest.xml.template'),
      this.destinationPath('dist/js/manifest.xml'),
      {props: this.props}
    );
    this.fs.copyTpl(
      this.templatePath('js/package.json.template'),
      this.destinationPath('dist/js/package.json'),
      {props: this.props}
    );
    this.fs.copyTpl(
      this.templatePath('js/README.md.template'),
      this.destinationPath('dist/js/README.md'),
      {props: this.props}
    );
  }
});
