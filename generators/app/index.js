'use strict';

const newHubLabel = 'Create New';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path = require('path');
var glob = require('glob');
var extend = require('util')._extend;
var utils = require('./../utilities');
var hubChoices = [newHubLabel];
var isNewHub = false;

function getKnownHubs(root) {
  var paths = glob.sync(root + 'org.opent2t.sample.hub.superpopular/com.*.hub/', {});

  paths.forEach(function (element) {
    var hub = path.parse(element).base;
    var hubName = hub.replace('com.', '').replace('.hub', '');
    hubChoices.push(hubName);
  });
}

module.exports = yeoman.Base.extend({
  constructor: function () {
    yeoman.Base.apply(this, arguments);

    this.argument('reporoot', { type: String, required: true });
    getKnownHubs(this.reporoot);
  },

  prompting: function () {
    this.log(yosay(
      chalk.red('opent2t translator') + ' generator!'
    ));

    var prompts = [
      {
        type: 'rawlist',
        name: 'hubName',
        message: 'Which hub does this translator use?',
        choices: hubChoices
      },
      {
        when: function (response) {
          return response.hubName === newHubLabel;
        },
        type: 'input',
        name: 'hubFriendlyName',
        message: 'What is the friendly name of the new hub (e.g. Contoso Controller)?'
      }
    ];

    var hub;

    return this.prompt(prompts).then(function (props) {
      this.props = props;
      var extraPrompts;

      if (this.props.hubName === newHubLabel) {

        isNewHub = true;
        hub = utils.createDeviceInfo(this.props.hubFriendlyName);

        extraPrompts = [
          {
            type: 'input',
            name: 'hubName',
            message: 'What is the name of the new hub?',
            default: hub.lowerName
          }
        ];
      } else {
        extraPrompts = [
          {
            type: 'input',
            name: 'hubFriendlyName',
            message: 'What is the friendly name of the hub?',
            default: this.props.hubName.charAt(0).toUpperCase() + this.props.hubName.slice(1)
          }
        ];
      }

      return this.prompt(extraPrompts).then(function (answers) {
        this.props = extend(this.props, answers);
        this.props.hub = utils.createDeviceInfo(this.props.hubFriendlyName, this.props.hubName);
      }.bind(this));
    }.bind(this));
  },

  execSubgenerator: function () {
    if (isNewHub) {
      this.composeWith('opent2t:hub',
        {
          options: {
            hub: this.props.hub
          }
        });
    }

    this.composeWith('opent2t:translator',
      {
        options: {
          repoRoot: this.reporoot,
          hub: this.props.hub
        }
      });
  }
});
