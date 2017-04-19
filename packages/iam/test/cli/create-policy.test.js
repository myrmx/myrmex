/*eslint-env mocha */
/* global testRequire */
'use strict';

const assert = require('assert');
const _ = require('lodash');
const cmd = testRequire('src/cli/create-policy');
const icli = require('comquirer');

describe('The create-policy sub-command', function() {

  it('is a function', () => {
    assert.equal(typeof cmd, 'function', 'the module "src/cli/create-policy" exposes a function');
  });

  it('creates a comquirer sub-command', () => {
    cmd(icli);
    assert.ok(
      _.find(icli.getProgram().commands, command => { return command._name === 'create-policy'; }),
      'a "create-policy sub command has been created"'
    );
  });

});
