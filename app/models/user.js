var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

  initialize: function(params) {
    params && params.hash && this.set('hash', params.hash);
    params && params.password && this.set('password', params.password);
    this.on('creating', this.hashPassword);
  },

  hashPassword: function(){
    if (this.get('password')) {
      var cipher = Promise.promisify(bcrypt.hash);
      return cipher(this.get('password'), null, null).bind(this)
        .then(function(hash) {
          this.set('hash', hash);
          this.unset('password');
        });
    }
  }
});

module.exports = User;