'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var packageNameValidate = require("validate-npm-package-name")

module.exports = yeoman.generators.Base.extend({
    prompting: function() {
        var done = this.async();

        // Have Yeoman greet the user.
        this.log(yosay(
            'Welcome to the ' + chalk.red('Open Translators to Things') + ' generator!'
        ));

        // Generate prompts.
        var prompts = [
            {
                type: 'input',
                name: 'name',
                message: 'What is the human-readable name of the thing you are writing a translator for (e.g. Contoso Light)?',
                validate: function(input) {
                    // name is required
                    var pass = !!input;
                    if (pass) {
                        return true;
                    } else {
                        return "Please enter a valid name.";
                    }
                }
            },
            {
                type: 'input',
                name: 'packageName',
                message: 'What is the node package name you want to use (e.g. translator-contoso-light)?',
                validate: function(input) {
                    var pass = input.toLowerCase().startsWith('translator-') && packageNameValidate(input).validForNewPackages;
                    if (pass) {
                        return true;
                    } else {
                        return "Please enter a valid package name. It must start with translator- and should adhere to the requirements for node package names.";
                    }
                }
            }
        ];

        this.prompt(prompts, function(props) {
            this.props = props;
            done();
        }.bind(this));
    },

    execSubgenerator: function() {

        this.composeWith('opent2t:translator',
            {
                options: {
                    nested: true,
                    name: this.props.name,
                    packageName: this.props.packageName
                }
            });
    }
});
