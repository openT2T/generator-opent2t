'use strict';

var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path = require('path');
var glob = require('glob');
var extend = require('util')._extend;
var utils = require('./../utilities');

const newHubLabel = 'Create New';
var hubChoices = [newHubLabel];
var schemaChoices = [];
var isNewHub = false;

// function getItemForValue(values, val) {
//   for (var i = 0; i < values.length; i++) {
//     if (values[i].value === val) {
//       return values[i];
//     }
//   }

//   return undefined;
// }

function getKnownDevices(root) {
  var paths = glob.sync(root + '/org.opent2t.sample.*.superpopular/', {});

  paths.forEach(function(element) {
    var schema = path.parse(element).base;
    var deviceName = schema.replace('org.opent2t.sample.', '').replace('.superpopular', '');
    // schemaChoices.push({name: deviceName, value: schema});
    if(deviceName !== 'hub') {
      schemaChoices.push(deviceName);
    }
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
        message: 'What is the friendly name of the new hub?'
      }
    ];

    var hub;

    return this.prompt(prompts).then(function (props) {
      this.props = props;
      var extraPrompts;

      //console.log("PROPS: " + JSON.stringify(this.props));

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
        //defaultHubName = hubName.charAt(0).toUpperCase() + hubName.slice(1);
        extraPrompts = [
          {
            type: 'input',
            name: 'hubFriendlyName',
            message: 'What is the friendly name-o of the hub?',
            default: this.props.hubName.charAt(0).toUpperCase() + this.props.hubName.slice(1)
          }
        ];
      }

        return this.prompt(extraPrompts).then(function (answers) {
          //this.props.hubName = answers.hubName;
          //console.log('NAME: ' + this.props.hubName);
          //console.log('FRIENDLY: ' + answers.hubFriendlyName);
          //console.log("PROPS: " + JSON.stringify(this.props));
          //console.log('ANSWERS: ' + JSON.stringify(answers));
          this.props = extend(this.props, answers);
          //console.log("PROPS2: " + JSON.stringify(this.props));
          this.props.hub = utils.createDeviceInfo(this.props.hubFriendlyName, this.props.hubName);
          //console.log("PROPS: " + JSON.stringify(this.props));
        }.bind(this));
      //}
    }.bind(this));
  },

  execSubgenerator: function () {
    //var hubName = this.props.hubType;

    if (isNewHub) {
      //hubName = this.props.hubName;
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
          hub: this.props.hub,
          deviceName: this.props.schemaName
        }
      });
  }
});
