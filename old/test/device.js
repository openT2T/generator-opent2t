'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-generator').test;

describe('generator-openT2T:translator', function() {
  before(function(done) {
    helpers.run(path.join(__dirname, '../generators/translator'))
      .withOptions({ someOption: true })
      .withPrompts({ someAnswer: true })
      .on('end', done);
  });

  it('creates files', function() {
    assert.file([
      'dummyfile.txt'
    ]);
  });
});
