'use strict';

var yeoman = require('yeoman-generator');
var extend = require('util')._extend;
var path = require('path');
var chalk = require('chalk');
var glob = require('glob');
var utils = require('./../utilities');

var requiredResources = [];

// TODO: We should get these lists from the cloud.
//       Temporarily getting the list from a locally synced repo.
function getKnownResources(resourceChoices, resourceInfos, repoRoot) {
  var paths = glob.sync(repoRoot + '/oic.r.*/', {});

  paths.forEach(function (resourcePath) {
    var ramlFiles = glob.sync(resourcePath + '*.raml', {});
    if (ramlFiles.length > 0) {
      var resourceName = path.basename(ramlFiles[0], '.raml');
      var resourceSchema = path.basename(resourcePath);
      resourceName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
      resourceInfos.push({ schema: resourceSchema, name: resourceName });
      resourceChoices.push(resourceSchema);
    }
  });
}

function getResourceInfo(resourceSchema, resourceInfos) {
  for (var i = 0; i < resourceInfos.length; i++) {
    if (resourceInfos[i].schema === resourceSchema) {
      return resourceInfos[i];
    }
  }

  return undefined;
}

function addRequiredResource(resourceInfo) {
  if (requiredResources.indexOf(resourceInfo) === -1) {
    requiredResources.push(resourceInfo);
  }
}

module.exports = yeoman.Base.extend({
  constructor: function () {
    yeoman.Base.apply(this, arguments);

    this.option('repo-root', {
      desc: 'The root of the translators repo',
      alias: 'r',
      type: String
    });

    this.props = { devices: [] };

    var resourceChoices = [];
    var resourceInfos = [];
    var repoRoot;

    if (this.options['repo-root'] === undefined) {
      this.log(chalk.bold.red('WARNING: ') + 'No repo specified. Defaulting to ../translators/');
      repoRoot = '../translators/';
    } else {
      repoRoot = this.options['repo-root'];
    }

    getKnownResources(resourceChoices, resourceInfos, repoRoot);

    this.addResource = function (device, message) {
      var that = this;
      var isFirst = device.resources.length === 0;
      var shouldAdd = function (response) {
        return isFirst || response.addResource;
      };

      var prompts = [
        {
          when: shouldAdd,
          type: 'rawlist',
          name: 'resourceSchema',
          message: isFirst ? 'What schema does the first resource use?' : 'What schema does the resource use?',
          choices: resourceChoices
        },
        {
          when: shouldAdd,
          type: 'input',
          name: 'resourceName',
          message: 'What is the resource name (e.g. colorMode)?',
          validate: utils.validateNotEmpty('Please enter a valid resource name.')
        },
        {
          when: shouldAdd,
          type: 'input',
          name: 'displayName',
          message: 'What is the resource display name (e.g. Color Mode)?',
          validate: utils.validateNotEmpty('Please enter a valid resource display name.')
        },
        {
          when: shouldAdd,
          type: 'input',
          name: 'resourceDescription',
          message: 'What is the resource description (e.g. Light on/off.)?',
          validate: utils.validateNotEmpty('Please enter a valid resource description.')
        },
        {
          when: shouldAdd,
          type: 'confirm',
          name: 'isWritable',
          message: 'Is the resource writable'
        }
      ];

      if (!isFirst) {
        prompts.unshift(
          {
            type: 'confirm',
            name: 'addResource',
            message: message
          }
        );
      }

      return this.prompt(prompts).then(function (props) {
        if (isFirst || props.addResource) {
          var resourceInfo = getResourceInfo(props.resourceSchema, resourceInfos);
          addRequiredResource(resourceInfo);
          device.resources.push({ schema: resourceInfo, name: props.resourceName, displayName: props.displayName, writable: props.isWritable, description: props.resourceDescription });
          that.log('');
          return that.addResource(device, 'Would you like to add another resource to ' + device.name + '?');
        }
      });
    };

    this.addDevice = function (devices) {
      var that = this;
      var isFirst = devices.length === 0;
      var shouldAdd = function (response) {
        return isFirst || response.addDevice;
      };

      var prompts = [
        {
          when: shouldAdd,
          type: 'input',
          name: 'deviceName',
          message: isFirst ? 'What is the human readable name of the first device?' : 'What is the human readable name of the device?',
          validate: utils.validateNotEmpty('Please enter a valid device name.')
        }
      ];

      if (!isFirst) {
        prompts.unshift(
          {
            type: 'confirm',
            name: 'addDevice',
            message: 'Would you like to add another device?'
          }
        );
      }

      return this.prompt(prompts).then(function (props) {
        if (isFirst || props.addDevice) {
          var device = { name: props.deviceName, resources: [] };
          devices.push(device);

          that.log(chalk.green('\nAdd resources'));
          that.log('Add one or more resources to the device\n');

          return that.addResource(device).then(function () {
            that.log('');
            return that.addDevice(devices);
          });
        }
      });
    };
  },

  prompting: function () {
    var prompts = [
      {
        type: 'input',
        name: 'schemaName',
        message: 'Please provide a name for the schema you would like to generate (e.g. org.opent2t.sample.lamp.superpopular)',
        validate: utils.validateNotEmpty('Please enter a valid schema name.')
      },
      {
        type: 'input',
        name: 'schemaDescription',
        message: 'Please provide a description for the schema',
        validate: utils.validateNotEmpty('Please enter a valid schema description.')
      },
      {
        type: 'input',
        name: 'schemaTitle',
        message: 'Please provide a title for the schema (e.g. OpenT2T SuperPopular Lamp)',
        validate: utils.validateNotEmpty('Please enter a valid schema title.')
      },
      {
        type: 'input',
        name: 'platformName',
        message: 'Please provide a name for the paltform (e.g. LightPlatform)',
        validate: utils.validateNotEmpty('Please enter a valid platform name.')
      }
    ];

    return this.prompt(prompts).then(function (props) {
      this.props = extend(this.props, props);
      this.log(chalk.blue('\nAdd devices'));
      this.log('Add one or more device definitions to the schema\n');
      return this.addDevice(this.props.devices);
    }.bind(this));
  },

  writing: function () {
    this.props.requiredResources = requiredResources;
    var destRoot = path.join('dest', this.props.schemaName, this.props.schemaName);
    this.fs.copyTpl(
      this.templatePath('schema.raml.template'),
      this.destinationPath(destRoot + '.raml'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('schema.json.template'),
      this.destinationPath(destRoot + '.json'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('schema.js.template'),
      this.destinationPath(destRoot + '.js'),
      { props: this.props }
    );
    this.fs.copyTpl(
      this.templatePath('schema.xml.template'),
      this.destinationPath(destRoot + '.xml'),
      { props: this.props }
    );
  }
});
