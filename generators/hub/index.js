'use strict';

var yeoman = require('yeoman-generator');
var extend = require('util')._extend;
const packagePrefix = 'opent2t-translator-com-';

module.exports = yeoman.Base.extend({
  constructor: function () {
    yeoman.Base.apply(this, arguments);
    this.option('hubName');
    this.option('hubFriendlyName');

    this.props = {
      hubName: this.options.hubName,
      hubFriendlyName: this.options.hubFriendlyName
    };

    this.props.packageName = packagePrefix + this.props.hubName.toLowerCase() + '-hub';
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
      }
    ];

    return this.prompt(prompts).then(function (props) {
      this.props = extend(this.props, props);
    }.bind(this));
  },

  writing: function () {
    this.fs.copyTpl(
      this.templatePath('js/common.js.template'),
      this.destinationPath('dist-hub/js/common.js'),
      {props: this.props}
    );
    this.fs.copyTpl(
      this.templatePath('js/manifest.xml.template'),
      this.destinationPath('dist-hub/js/manifest.xml'),
      {props: this.props}
    );
    this.fs.copyTpl(
      this.templatePath('js/package.json.template'),
      this.destinationPath('dist-hub/js/package.json'),
      {props: this.props}
    );
    this.fs.copyTpl(
      this.templatePath('js/README.md.template'),
      this.destinationPath('dist-hub/js/README.md'),
      {props: this.props}
    );
    this.fs.copyTpl(
      this.templatePath('js/thingTranslator.js.template'),
      this.destinationPath('dist-hub/js/thingTranslator.js'),
      {props: this.props}
    );
  }
});
