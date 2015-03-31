var request = require('request');
var Session = require('../app/models/session');

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/

// more code here

exports.createSession = function(req, res, user) {
  console.log('creatingSession');
  var token = Math.floor(Math.random()*10000000000000000).toString(16);
  var session = new Session({
    user_id: user.get('id'),
    token: token
  });
  session.save().then(function() {
    res.cookie(user.get('id'), token);
    res.redirect('/');
  })
};

exports.checkUser = function(req, res, next) {
  var cookies = req.cookies;
  if (cookies) {
    console.log("checkingUser", cookies);
    var user_id = Object.keys(cookies)[0];
    new Session({
      user_id: user_id,
      token: cookies[user_id]
    }).fetch().then(function(found) {
      if (found) {
        // another check to see if it has expired
        next();
      } else {
        res.redirect('/login');
      }
    });
  } else {
    res.redirect('/login');
  }
};

