'use strict';

var fullyReplicate = require('./fully-replicate');
var sync = require('./sync');

function fullyReplicateFrom(url, opts, callback) {
  /*jshint validthis:true */
  return fullyReplicate.replicate(url, this, opts, callback);
}

function fullyReplicateTo(url, opts, callback) {
  /*jshint validthis:true */
  return fullyReplicate.replicate(this, url, opts, callback);
}

function fullySync(dbName, opts, callback) {
  /*jshint validthis:true */
  return sync(this, dbName, opts, callback);
}

module.exports = {
  fullyReplicateFrom: fullyReplicateFrom,
  fullyReplicateTo: fullyReplicateTo,
  fullySync: fullySync
};

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(exports);
}