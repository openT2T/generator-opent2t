'use strict';

const packagePrefix = 'opent2t-translator-com-';
const onboardPrefixx = 'org.opent2t.onboarding.';
var yeoman = require('yeoman-generator');
var extend = require('util')._extend;
var utils = require('./../utilities');
var devInputs = [];
var userInputs = [];
var argumentTypes = ['input', 'password'];

module.exports = yeoman.Base.extend({
  constructor: function () {
    yeoman.Base.apply(this, arguments);
    this.option('hub');

    this.props = {
      hub: this.options.hub
    };

    this.props.packageName = packagePrefix + this.props.hub.lowerName + '-hub';
    this.props.onboardingPackage = onboardPrefixx + this.props.hub.lowerName + 'hub';

    this.addDependency = function (dependencies, inputMessage) {

      var shouldAdd = function (response) {
        return response.addInput;
      };

      var that = this;
      return this.prompt(
        [
          {
            type: 'confirm',
            name: 'addInput',
            message: 'Would you like to add ' + (dependencies.length === 0 ? 'a' : 'another') + inputMessage + ' input argument?'
          },
          {
            when: shouldAdd,
            type: 'input',
            name: 'argName',
            message: 'What is the argument name?',
            validate: utils.validateNotEmpty('Please enter a valid argumant name.')
          },
          {
            when: shouldAdd,
            type: 'rawlist',
            name: 'argType',
            message: 'What is the argument type?',
            choices: argumentTypes
          },
          {
            when: shouldAdd,
            type: 'input',
            name: 'argDescription',
            message: 'What is the argument description?',
            validate: utils.validateNotEmpty('Please enter a valid argumant description.')
          }
        ]).then(function (props) {
          if (props.addInput) {
            dependencies.push({ name: props.argName, type: props.argType, description: props.argDescription, shortType: props.argType === 'input' ? 's' : 'u' });
            return that.addDependency(dependencies, inputMessage);
          }
        });
    };
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
        default: this.props.onboardingPackage,
        validate: utils.validateNotEmpty('Please enter a valid package name.')
      }
    ];

    return this.prompt(prompts).then(function (props) {
      this.props = extend(this.props, props);
      var that = this;
      return this.addDependency(devInputs, 'developer').then(function () {
        return that.addDependency(userInputs, 'user').then(function () {
          return that.prompt(
            [
              {
                type: 'confirm',
                name: 'addUserPermission',
                message: 'Would you like to add a user permission url?'
              },
              {
                when: function (response) {
                  return response.addUserPermission;
                },
                type: 'input',
                name: 'userPermissionUrl',
                message: 'What is the url?',
                validate: function (input) {
                  var missingTokens = [];
                  var allInputs = devInputs.concat(userInputs);
                  var regex = /{(?!state)(.*?)}/g;
                  var match;

                  do {
                    match = regex.exec(input);
                    if (match) {
                      var tokenName = match[1];
                      var foundToken = false;
                      for (var i = 0; !foundToken && i < allInputs.length; i++) {
                        if (allInputs[i].name === tokenName) {
                          foundToken = true;
                        }
                      }

                      if (!foundToken && missingTokens.indexOf(tokenName) === -1) {
                        missingTokens.push(tokenName);
                      }

                    }
                  } while (match);

                  if (missingTokens.length === 0) {
                    return true;
                  }
                  return 'Unknown arguments [' + missingTokens.join() + '].';
                }
              }
            ]
          ).then(function (props) {
            that.props = extend(that.props, props);
            that.props.devInputs = devInputs;
            that.props.userInputs = userInputs;
          });
        });
      });
    }.bind(this));
  },

  writing: function () {
    var destRoot = 'dest/com.' + this.props.hub.lowerName + '.hub';
    var onboardingName = 'org.opent2t.onboarding.' + this.props.hub.lowerName + 'hub';
    var onboardingRoot = 'dest/' + onboardingName;
    this.fs.copyTpl(
      this.templatePath('js/common.js.template'),
      this.destinationPath(destRoot + '/js/common.js'),
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
      this.templatePath('js/thingTranslator.js.template'),
      this.destinationPath(destRoot + '/js/thingTranslator.js'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('test/package.json.template'),
      this.destinationPath(destRoot + '/test/package.json'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('test/mockHub.js.template'),
      this.destinationPath(destRoot + '/test/mock' + this.props.hub.capName + 'Hub.js'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('onboarding/onboarding.xml.template'),
      this.destinationPath(onboardingRoot + '/' + onboardingName + '.xml'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('js/common.js.template'),
      this.destinationPath(onboardingRoot + '/js/common.js'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('onboarding/js/package.json.template'),
      this.destinationPath(onboardingRoot + '/js/package.json'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('onboarding/js/README.md.template'),
      this.destinationPath(onboardingRoot + '/js/README.md'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('onboarding/js/thingOnboarding.js.template'),
      this.destinationPath(onboardingRoot + '/js/thingOnboarding.js'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('onboarding/js/tests/test.js.template'),
      this.destinationPath(onboardingRoot + '/js/tests/test.js'),
      { props: this.props }
    );
  }
});
