// more code here

var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var cookieParser = require('cookie-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));

// Login required for homepage and create and links
  // if no session go to login 

app.get('/', util.checkUser,
function(req, res) {
  res.render('index');
});

app.get('/create', util.checkUser,
function(req, res) {
  res.render('index');
});

app.get('/links', util.checkUser,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', util.checkUser,
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', function(req,res){
  res.render('login'); 
});

app.get('/signup', function(req,res) {
  res.render('signup');
});

app.post('/login', function(req,res) {
  var username = req.body.username;
  var password = req.body.password;

  new User ({username: username}).fetch().then(function(user){
    if (!user) {
      res.redirect('/login');
    }
    else {
      // password has to be salted and hashed, and compare to password field in db
      // compare does salt and hash automatically
      bcrypt.compare(password, user.get('hash'), function(err, match){
        if (match) {
          util.createSession (req, res, user); // need to createSession function
        } else {
          res.redirect('/login');       
        }
      });
    } 
  });
});

app.post('/signup', function(req,res) {
  var username = req.body.username;
  var password = req.body.password;
  if (password.length < 5) {
    res.send("<script type='text/javascript'>alert('Password must be at least 5 characters!');window.location.href = '/signup';</script>");
  } else {
    new User ({username: username}).fetch().then(function(user){
      if (user) {
        res.send("<script type='text/javascript'>alert('Username Taken!');window.location.href = '/signup';</script>");
      } else {
        // password has to be salted and hashed and stored
        bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(password, salt, null, function(err, hash) {
            var newUser = new User({username:username, hash:hash});
            newUser.save().then(function(myUser) {
              Users.add(myUser);
              util.createSession(req, res, newUser);
            });
          })
        })
      } 
    });
  }
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');

app.listen(4568);
