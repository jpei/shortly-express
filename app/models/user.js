var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

  initialize: function(params) {
    params && params.password && this.set('password', params.password);
  },

  sessions: function() {
    return this.hasMany(Session);
  }
});

module.exports = User;