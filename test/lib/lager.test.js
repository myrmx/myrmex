/*eslint-env mocha */
'use strict';

const assert = require('assert');
const Promise = require('bluebird');
const lager = require.main.require('src/lib/lager');


describe('The lager instance', function() {

  it('should fire events', () => {
    return lager.fire('superEvent', 'a string', { foo: 'lager', bar: 100 })
    .spread((arg1, arg2) => {
      assert.equal(arg1, 'a string', 'the first argument is correctly retrieved');
      assert.equal(arg2.foo, 'lager', 'the second argument is correctly retrieved (1)');
      assert.equal(arg2.bar, 100, 'the second argument is correctly retrieved (2)');
    });
  });

  it('should register plugins', () => {
    lager.registerPlugin({
      name: 'a-simple-plugin',
      hooks: {
        myEvent: (arg1, arg2) => {
          arg1 += ' modified by a plugin';
          arg2.bar += 23;
          return Promise.resolve([arg1, arg2]);
        }
      }
    });
    lager.registerPlugin({
      name: 'another-simple-plugin',
      hooks: {
        myEvent: (arg1, arg2) => {
          arg2.baz = 'value from plugin';
          return Promise.resolve([arg1, arg2]);
        }
      }
    });
    lager.registerPlugin({
      name: 'another-plugin-that-does-not-implement-the kook',
      hooks: {}
    });
  });

  it('should retrieve data altered by plugins', () => {
    return lager.fire('myEvent', 'a string', { foo: 'lager', bar: 100 })
    .spread((arg1, arg2) => {
      assert.equal(arg1, 'a string modified by a plugin', 'the first argument is correctly retrieved');
      assert.equal(arg2.foo, 'lager', 'the second argument is correctly retrieved (1)');
      assert.equal(arg2.bar, 123, 'the second argument is correctly retrieved (2)');
      assert.equal(arg2.baz, 'value from plugin', 'the second argument is correctly retrieved (3)');
    });
  });

  it('should retrieve plugins that have been registerd', () => {
    assert.equal(lager.getPlugin('a-simple-plugin').name, 'a-simple-plugin', 'the plugin has been retrieved');
    assert.equal(lager.getPlugin('a-plugin-that-does-not-exists'), null, 'searching for an unregistered name returns null');
  });

});
