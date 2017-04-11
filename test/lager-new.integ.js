/*eslint-env mocha */
'use strict';

const assert = require('assert');

describe('Creation of a new project', () => {

  let icli;

  before(() => {
    process.chdir(__dirname);
    delete require.cache[require.resolve('../packages/cli/src/bin/lager')];
    return require('../packages/cli/src/bin/lager')
    .then(lagerCli => {
      icli = lagerCli;
    });
  });

  it('should be done via the sub-command "new"', () => {
    return icli.parse('node script.js new my-project @lager/iam @lager/node-lambda'.split(' '))
    .then(res => {
      assert.ok(true);
    });
  });

});
