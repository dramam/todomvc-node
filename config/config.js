var app = require('../app');
var env = process.env.NODE_ENV || 'development';

module.exports = {
  [env]: {
    migrationStorageTableName: '_migrations'
  }
};