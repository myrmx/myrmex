/*eslint-env mocha */
/* global testRequire */
'use strict';

const assert = require('assert');
const _ = require('lodash');
const cmd = testRequire('src/cli/deploy-roles');
const icli = require('comquirer');

describe('The deploy-roles sub-command', function() {

  it('is a function', () => {
    assert.equal(typeof cmd, 'function', 'the module "src/cli/deploy-roles" exposes a function');
  });

  it('creates a comquirer sub-command', () => {
    cmd(icli);
    assert.ok(
      _.find(icli.getProgram().commands, command => { return command._name === 'deploy-roles'; }),
      'a "deploy-roles sub command has been created"'
    );
  });

});
