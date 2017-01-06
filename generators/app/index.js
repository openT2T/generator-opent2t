'use strict';

const newHubLabel = 'Create New';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path = require('path');
var glob = require('glob');
var utils = require('./../utilities');

function getHub(hubName) {
  return utils.createDeviceInfo(hubName.replace('com.', '').replace('.hub', ''));
}

module.exports = yeoman.Base.extend({
  constructor: function () {
    yeoman.Base.apply(this, arguments);

    this.option('repo-root', {
      desc: 'The root of the translators repo',
      alias: 'r',
      type: String
    });

    this.option('device-schema', {
      desc: 'The path to the raml schema that the device will implement',
      alias: 'ds',
      type: String
    });

    this.option('hub', {
      desc: 'The package name of the hub used by the device',
      type: String
    });

    this.createHub = false;

    if (this.options['repo-root'] === undefined) {
      this.log(chalk.bold.red('WARNING: ') + 'No repo specified. Defaulting to ../translators/');
      this.env.options['repo-root'] = '../translators/';
    } else {
      this.env.options['repo-root'] = this.options['repo-root'];
    }

    this.env.options['device-schema'] = this.options['device-schema'];

    if (this.options.hub !== undefined) {
      this.hub = getHub(this.options.hub);
    }
  },

  prompting: function () {
    this.log(yosay(chalk.red('opent2t translator') + ' generator!'));

    if (this.hub === undefined) {
      var paths = glob.sync(this.env.options['repo-root'] + 'org.opent2t.sample.hub.superpopular/com.*.hub/', {});
      var hubChoices = paths.map(p => path.parse(p).base);
      hubChoices.unshift(newHubLabel);

      return this.prompt(
        [
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
            message: 'What is the friendly name of the new hub (e.g. Contoso Controller)?',
            validate: utils.validateNotEmpty('Please enter a valid name.')
          }
        ]
      ).then(function (props) {
        if (props.hubName === newHubLabel) {
          this.hub = utils.createDeviceInfo(props.hubFriendlyName);
          this.createHub = true;
        } else {
          this.hub = getHub(props.hubName);
        }
      }.bind(this));
    }
  },

  execSubgenerator: function () {
    if (this.createHub) {
      this.composeWith('opent2t:hub',
        {
          options: {
            hub: this.hub
          }
        });
    }

    this.composeWith('opent2t:translator',
      {
        options: {
          repoRoot: this.env.options['repo-root'],
          hub: this.hub,
          schema: this.env.options['device-schema']
        }
      });
  }
});
