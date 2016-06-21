var replicate = require('./replicateWrapper');
var sync = require('./sync');

function fullyReplicateFrom(other, opts, callback) {
  /*jshint validthis:true */
  return replicate.replicate(other, this, opts, callback);
}

function fullyReplicateTo(other, opts, callback) {
  /*jshint validthis:true */
  return replicate.replicate(this, other, opts, callback);
}

function fullySync(dbName, opts, callback) {
  /*jshint validthis:true */
  return sync(this, dbName, opts, callback);
}

var plugin = {
  fullyReplicateFrom: fullyReplicateFrom,
  fullyReplicateTo: fullyReplicateTo,
  fullySync: fullySync
};

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(plugin);
}

module.exports = plugin;