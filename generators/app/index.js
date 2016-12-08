'use strict';

var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

var hubChoices = [
  {name: 'Create New', value: 'new'},
  {name: 'Wink', value: 'wink'},
  {name: 'Smart Things', value: 'smartthings'}
];

var schemaChoices = [
  {name: 'Binary Switch', value: 'org.opent2t.sample.binaryswitch.superpopular'},
  {name: 'Lamp', value: 'org.opent2t.sample.lamp.superpopular'},
  {name: 'Thermostat', value: 'org.opent2t.sample.thermostat.superpopular'}
];

function getItemForValue(values, val) {
  for (var i = 0; i < values.length; i++) {
    if (values[i].value === val) {
      return values[i];
    }
  }

  return undefined;
}

module.exports = yeoman.Base.extend({
  prompting: function () {
    this.log(yosay(
      chalk.red('opent2t translator') + ' generator!'
    ));

    var prompts = [
      {
        type: 'rawlist',
        name: 'hubType',
        message: 'Which hub does this translator use?',
        choices: hubChoices
      },
      {
        when: function (response) {
          return response.hubType === 'new';
        },
        type: 'input',
        name: 'hubName',
        message: 'What is the name of the new hub?'
      },
      {
        when: function (response) {
          return response.hubType === 'new';
        },
        type: 'input',
        name: 'hubFriendlyName',
        message: 'What is the friendly name of the new hub?'
      },
      {
        type: 'rawlist',
        name: 'schemaName',
        message: 'Which schema does the device use?',
        choices: schemaChoices
      }
    ];

    return this.prompt(prompts).then(function (props) {
      this.props = props;
    }.bind(this));
  },

  execSubgenerator: function () {
    var hub;

    if (this.props.hubType === 'new') {
      hub = {name: this.props.hubFriendlyName, value: this.props.hubName};
      this.composeWith('opent2t:hub',
        {
          options: {
            hub: hub
          }
        });
    } else {
      hub = getItemForValue(hubChoices, this.props.hubType)
    }

    this.composeWith('opent2t:translator',
      {
        options: {
          hub: hub,
          schema: getItemForValue(schemaChoices, this.props.schemaName)
        }
      });
  }
});
