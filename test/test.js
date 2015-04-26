/*jshint expr:true */
'use strict';

var PouchDB = require('pouchdb');

//
// your plugin goes here
//
var thePlugin = require('../');
PouchDB.plugin(thePlugin);

var chai = require('chai');

//
// more variables you might want
//
chai.should(); // var should = chai.should();
var Promise = require('bluebird'); // var Promise = require('bluebird');

var dbPairs = [
  ['local', 'local'],
  ['local', 'http'],
  ['http', 'local'],
  ['http', 'http']
];

dbPairs.forEach(function (pair) {
  var dbNames = pair.map(function (type, i) {
    if (type === 'local') {
      return 'testdb_' + (i + 1);
    } else {
      return 'http://127.0.0.1:5984/testdb_' + (i + 1);
    }
  });

  describe(pair[0] + '-' + pair[1], function () {
    tests(dbNames[0], dbNames[1]);
  });
});

function tests(dbName1, dbName2) {

  var db;
  var remote;

  beforeEach(function () {
    db = new PouchDB(dbName1);
    remote = new PouchDB(dbName2);
  });

  afterEach(function () {
    return Promise.all([
      db.destroy(),
      remote.destroy()
    ]);
  });

  function hasAllRevs(docRevs) {
    var promises = [];
    Object.keys(docRevs).forEach(function (doc) {
      docRevs[doc].forEach(function (rev) {
        [db, remote].forEach(function (pouch) {
          promises.push(pouch.get(doc, {rev: rev}));
        });
      });
    });
    return Promise.all(promises);
  }


  describe('basic test suite', function () {
    this.timeout(60000);

    it('should replicate empty dbs', function () {
      return db.fullyReplicateTo(remote).then(function () {
        return db.info();
      }).then(function (info) {
        info.doc_count.should.equal(0);
        return remote.info();
      }).then(function (info) {
        info.doc_count.should.equal(0);
      });
    });

    it('should replicate non-leafs', function () {

      return db.bulkDocs({
        docs: [
          {
            _id: 'foobar',
            _rev: '2-a2',
            _revisions: { start: 2, ids: [ 'a2', 'a1' ] }
          },
          {
            _id: 'foobar',
            _rev: '1-a1',
            _revisions: { start: 1, ids: [ 'a1' ] }
          }
        ],
        new_edits: false
      }).then(function () {
        return db.fullyReplicateTo(remote);
      }).then(function () {
        return db.info();
      }).then(function (info) {
        info.doc_count.should.equal(1);
        return remote.info();
      }).then(function (info) {
        info.doc_count.should.equal(1);

        var docRevs = {
          foobar: ['2-a2', '1-a1']
        };

        return hasAllRevs(docRevs);
      });
    });
  });
}
