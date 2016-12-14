'use strict';

var yeoman = require('yeoman-generator');
var extend = require('util')._extend;
const packagePrefix = 'opent2t-translator-com-';
const onboardPrefixx = 'org.opent2t.onboarding.';

module.exports = yeoman.Base.extend({
  constructor: function () {
    yeoman.Base.apply(this, arguments);
    this.option('hub');

    this.props = {
      hub: this.options.hub
    };

    this.props.packageName = packagePrefix + this.props.hub.lowerName + '-hub';
    this.props.onboardingPackage = onboardPrefixx + this.props.hub.lowerName + 'hub';
  },

  prompting: function () {
    var prompts = [
      {
        type: 'input',
        name: 'packageName',
        message: 'What is the name of the hub node package?',
        default: this.props.packageName,
        validate: function (input) {
          var pass = input.toLowerCase().startsWith(packagePrefix);
          if (pass) {
            return true;
          }
          return 'Please enter a valid package name. It must start with ' + packagePrefix + ' and should adhere to the requirements for node package names.';
        }
      },
      {
        type: 'input',
        name: 'onboardingPackage',
        message: 'What is the name of the onboarding node package?',
        default: this.props.onboardingPackage
      }
    ];

    return this.prompt(prompts).then(function (props) {
      this.props = extend(this.props, props);
    }.bind(this));
  },

  writing: function () {
    var destRoot = 'dest/com.' + this.props.hub.lowerName + '.hub';
    this.fs.copyTpl(
      this.templatePath('js/common.js.template'),
      this.destinationPath(destRoot + '/js/common.js'),
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
      this.templatePath('js/thingTranslator.js.template'),
      this.destinationPath(destRoot + '/js/thingTranslator.js'),
      {props: this.props}
    );
    this.fs.copyTpl(
      this.templatePath('test/package.json.template'),
      this.destinationPath(destRoot + '/test/package.json'),
      {props: this.props}
    );
    this.fs.copyTpl(
      this.templatePath('test/mockHub.js.template'),
      this.destinationPath(destRoot + '/test/mock' + this.props.hub.capName + 'Hub.js'),
      {props: this.props}
    );
  }
});
