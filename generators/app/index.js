'use strict';

var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path = require('path');
var glob = require('glob');

const newHubLabel = 'Create New';
var hubChoices = [newHubLabel];
var schemaChoices = [];

function getItemForValue(values, val) {
  for (var i = 0; i < values.length; i++) {
    if (values[i].value === val) {
      return values[i];
    }
  }

  return undefined;
}

function getKnownDevices(root) {
  var paths = glob.sync(root + '/org.opent2t.sample.*.superpopular/', {});

  paths.forEach(function(element) {
    var schema = path.parse(element).base;
    var deviceName = schema.replace('org.opent2t.sample.', '').replace('.superpopular', '');
    schemaChoices.push({name: deviceName, value: schema});
  });
}

function getKnownHubs(root) {
  var paths = glob.sync(root + 'org.opent2t.sample.hub.superpopular/com.*.hub/', {});

  paths.forEach(function(element) {
    var hub = path.parse(element).base;
    var hubName = hub.replace('com.', '').replace('.hub', '');
    hubChoices.push(hubName);
  });
}

module.exports = yeoman.Base.extend({
  constructor: function () {
    yeoman.Base.apply(this, arguments);

    this.argument('reporoot', { type: String, required: true });
    getKnownDevices(this.reporoot);
    getKnownHubs(this.reporoot);
  },

  prompting: function () {
    this.log(yosay(
      chalk.red('opent2t translator') + ' generator!'
    ));

    var prompts = [
      {
        type: 'rawlist',
        name: 'schemaName',
        message: 'Which schema does the device use?',
        choices: schemaChoices
      },
      {
        type: 'rawlist',
        name: 'hubType',
        message: 'Which hub does this translator use?',
        choices: hubChoices
      },
      {
        when: function (response) {
          return response.hubType === newHubLabel;
        },
        type: 'input',
        name: 'hubFriendlyName',
        message: 'What is the friendly name of the new hub?'
      }
    ];

    return this.prompt(prompts).then(function (props) {
      this.props = props;

      if (this.props.hubType === newHubLabel) {

        var extraPrompts = [
          {
            type: 'input',
            name: 'hubName',
            message: 'What is the name of the new hub?',
            default: this.props.hubFriendlyName.replace(/ /g, '').toLowerCase()
          }
        ];

        return this.prompt(extraPrompts).then(function (answers) {
          this.props.hubName = answers.hubName;
        }.bind(this));
      }
    }.bind(this));
  },

  execSubgenerator: function () {
    var hubName = this.props.hubType;

    if (this.props.hubType === newHubLabel) {
      hubName = this.props.hubName;
      this.composeWith('opent2t:hub',
        {
          options: {
            hubName: this.props.hubName,
            hubFriendlyName: this.props.hubFriendlyName
          }
        });
    }

    this.composeWith('opent2t:translator',
      {
        options: {
          repoRoot: this.reporoot,
          hubName: hubName,
          hubFriendlyName: this.props.hubFriendlyName,
          schema: getItemForValue(schemaChoices, this.props.schemaName)
        }
      });
  }
});
