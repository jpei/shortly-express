var db = require('../config');
var User = require('./user.js');

var Session = db.Model.extend({
  tableName: 'sessions',
  hasTimestamps: true,
  
  user: function() {
    return this.belongsTo(User, 'user_id');
  },

  initialize: function(params) {
    params && params.token && this.set('token', params.token);
  }

});

module.exports = Session;