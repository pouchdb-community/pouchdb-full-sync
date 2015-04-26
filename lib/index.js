'use strict';

var fullReplicate = require('./full-replicate');

exports.fullyReplicateFrom = function (url, opts, callback) {
  return fullReplicate(url, this, opts, callback);
};

exports.fullyReplicateTo = function (url, opts, callback) {
  return fullReplicate(this, url, opts, callback);
};

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(exports);
}