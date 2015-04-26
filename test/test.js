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

    it('should replicate many non-leafs', function () {

      var len = 101;
      var docs = [];
      var revs = [];
      for (var i = 0; i < len; i++) {

        var ids = [];
        for (var j = 0; j < i + 1; j++) {
          ids.push((i - j + 1).toString());
        }

        var rev = (i + 1) + '-' + (i + 1);
        revs.push(rev);

        docs.push({
          _id: 'foobar',
          _rev: rev,
          _revisions: {start: (i + 1), ids: ids}
        });
      }

      return db.bulkDocs({
        docs: docs,
        new_edits: false
      }).then(function () {
        return db.fullyReplicateTo(remote);
      }).then(function () {
        return hasAllRevs({foobar: revs});
      });
    });

    it('should work when revs are already missing', function () {

      var len = 101;
      var docs = [];
      var revs = [];
      for (var i = 0; i < len; i++) {

        var ids = [];
        for (var j = 0; j < i + 1; j++) {
          ids.push((i - j + 1).toString());
        }

        var rev = (i + 1) + '-' + (i + 1);
        revs.push(rev);

        docs.push({
          _id: 'foobar',
          _rev: rev,
          _revisions: {start: (i + 1), ids: ids}
        });
      }

      return db.bulkDocs({
        docs: docs,
        new_edits: false
      }).then(function () {
        return db.compact();
      }).then(function () {
        return db.fullyReplicateTo(remote);
      }).then(function () {
        return db.get('foobar', {rev: revs[revs.length - 1]});
      }).then(function () {
        return db.get('foobar', {rev: revs[revs.length - 2]}).then(function () {
          throw new Error('should have failed to get()');
        }, function (err) {
          err.should.exist();
        });
      });
    });

    it('should replicate conflicting parents 1', function () {

      var docs = [
        {
          _id: 'foobar',
          _deleted: true,
          _rev: '3-a3',
          _revisions: { start: 3, ids: [ 'a3', 'a2', 'a1' ] }
        }, {
          _id: 'foobar',
          _rev: '2-a2',
          _revisions: { start: 2, ids: [ 'a2', 'a1' ] }
        }, {
          _id: 'foobar',
          _rev: '1-a1',
          _revisions: { start: 1, ids: [ 'a1' ] }
        }, {
          _id: 'foobar',
          _rev: '1-b1',
          _revisions: { start: 1, ids: [ 'b1' ] }
        }
      ];

      return db.bulkDocs({
        docs: docs,
        new_edits: false
      }).then(function () {
        return db.fullyReplicateTo(remote);
      }).then(function () {
        var revs = docs.map(function (doc) {
          return doc._rev;
        });

        var docRevs = {
          foobar: revs
        };
        return hasAllRevs(docRevs);
      });
    });

    it('should replicate conflicting parents 2', function () {

      var docs = [
        {
          _id: 'foobar',
          _deleted: true,
          _rev: '3-a3',
          _revisions: { start: 3, ids: [ 'a3', 'a2', 'a1' ] }
        }, {
          _id: 'foobar',
          _rev: '2-a2',
          _revisions: { start: 2, ids: [ 'a2', 'a1' ] }
        }, {
          _id: 'foobar',
          _rev: '1-a1',
          _revisions: { start: 1, ids: [ 'a1' ] }
        }, {
          _id: 'foobar',
          _rev: '1-b1',
          _revisions: { start: 1, ids: [ 'b1' ] }
        }, {
          _id: 'foobar',
          _rev: '2-b2',
          _revisions: { start: 2, ids: [ 'b2', 'b1' ] }
        }, {
          _id: 'foobar',
          _rev: '2-bb2',
          _revisions: { start: 2, ids: [ 'bb2', 'b1'] }
        }, {
          _id: 'foobar',
          _rev: '1-c1',
          _revisions: { start: 1, ids: [ 'c1' ] }
        }, {
          _id: 'foobar',
          _rev: '2-c2',
          _revisions: {start: 2, ids: ['c2', 'c1'] }
        }
      ];

      return db.bulkDocs({
        docs: docs,
        new_edits: false
      }).then(function () {
        return db.fullyReplicateTo(remote);
      }).then(function () {
        var revs = docs.map(function (doc) {
          return doc._rev;
        });

        var docRevs = {
          foobar: revs
        };
        return hasAllRevs(docRevs);
      });
    });

  });
}
