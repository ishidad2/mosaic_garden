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
    db.createTable('garden_messages', {
      id: {type: 'int', primaryKey: true},
      message_ja: 'string',
      message_en: 'string',
      created_at: 'datetime',
      updated_at: 'datetime',
    });
  return null;
};

exports.down = function(db) {
  db.dropTable('garden_messages');
  return null;
};

exports._meta = {
  "version": 1
};
