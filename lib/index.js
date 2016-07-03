'use strict';

var fullyReplicate = require('./fully-replicate');
var sync = require('./sync');

function fullyReplicateFrom(url, opts, callback) {
  /* jshint validthis:true */
  opts = opts || {};
  opts.PouchConstructor = this.constructor;
  return fullyReplicate.replicate(url, this, opts, callback);
}

function fullyReplicateTo(url, opts, callback) {
  /* jshint validthis:true */
  opts = opts || {};
  opts.PouchConstructor = this.constructor;
  return fullyReplicate.replicate(this, url, opts, callback);
}

function fullySync(dbName, opts, callback) {
  /* jshint validthis:true */
  opts = opts || {};
  opts.PouchConstructor = this.constructor;
  return sync(this, dbName, opts, callback);
}

var plugin = {
  fullyReplicateFrom: fullyReplicateFrom,
  fullyReplicateTo: fullyReplicateTo,
  fullySync: fullySync
};

module.exports = plugin;

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(plugin);
}
