var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

  initialize: function(params) {
    params && params.hash && this.set('hash', params.hash);
  }
});

module.exports = User;