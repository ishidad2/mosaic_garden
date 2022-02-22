'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  db.createTable('garden_black_lists', {
    id: {type: 'int', primaryKey: true},
      address: 'string',
      created_at: 'datetime',
      updated_at: 'datetime',
    });
    return null;
};

exports.down = function(db) {
  db.dropTable('garden_black_lists');
  return null;
};



exports._meta = {
  "version": 1
};
