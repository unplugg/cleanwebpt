
/**
 * Module dependencies.
 */
var express = require('express')
  , routes = require('./routes')
  , connect = require('connect')
  , user = require('./routes/user')
  , http = require('http')
  , util = require('util')
  , path = require('path')
  , jade = require('jade')
  , flash = require('connect-flash')
  , MailChimpAPI = require('mailchimp').MailChimpAPI
  , stylus = require('stylus')
  , connectTimeout = require('connect-timeout')
  , mongoStore = require('connect-mongodb')
  , app = module.exports = express()
  , mongoose = require('mongoose')
  , nib = require('nib')
  , models = require('./models')
  ,  db
  , Settings = { development: {}, test: {}, production: {} };

var app = express();

function renderJadeFile(template, options) {
  var fn = jade.compile(template, options);
  return fn(options.locals);
}

function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib());
}

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(stylus.middleware(
    { src: __dirname + '/public'
    , compile: compile
    }
  ));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.cookieParser());
  app.use(connectTimeout({ time: 10000 }));
  app.use(express.session({ store: mongoStore(app.set('db-uri')), secret: 'topsecret' }));
  app.use(flash());
  app.use(express.cookieParser('keyboard cat'));
  app.use(express.session({ cookie: { maxAge: 60000 }}));
});


/**
 * App env
 */
app.configure('development', function() {
  app.set('db-uri', 'mongodb://localhost/cleanwebpt-development');
  app.use(express.errorHandler({ dumpExceptions: true }));
  app.set('view options', {
    pretty: true
  });
});

app.configure('test', function() {
  app.set('db-uri', 'mongodb://localhost/cleanwebpt-test');
  app.set('view options', {
    pretty: true
  });  
});

app.configure('production', function() {
  app.set('db-uri', 'mongodb://localhost/cleanwebpt-production');
});

models.defineModels(mongoose, function() {
  app.User = User = mongoose.model('User');
  //db = mongoose.createConnection('localhost', 'test');
  db = mongoose.connect(app.set('db-uri'));
})

if (app.settings.env == 'production') {
  app.use(function(err, req, res) {
    res.render('500.jade', {
      status: 500,
      locals: {
        error: err
      } 
    });
  });
}

/**
 * Error Handling
 */
function NotFound(msg) {
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}

util.inherits(NotFound, Error);

app.get('/404', function(req, res) {
  throw new NotFound;
});

app.get('/500', function(req, res) {
  throw new Error('An expected error');
});

app.get('/bad', function(req, res) {
  unknownMethod();
});

app.use(function(err, req, res, next) {
  if (err instanceof NotFound) {
    res.render('404.jade', { status: 404 });
  } else {
    next(err);
  }
});


/**
 * Users
 */
app.post('/users.:format?', function(req, res) {

  var user = new User(req.body.user);

  User.find({email: user.email}, function(errors, docs) {
    if(errors) {
      console.log(errors)
    } else {
      if(docs.length > 0)
        res.render('index',
          { title : 'CleanWebPT', message: "This email already exists" }
        )

    }
  });

  function userSaveFailed(err) {
    res.render('index',
      { title : 'CleanWebPT', message: err }
    )
  }

  user.save(function(err) {
    if (err) return userSaveFailed(err);

    switch (req.params.format) {
      case 'json':
        res.send(user.toObject());
      break;
      default:
        res.render('index',
        { title : 'CleanWebPT', message: "Email saved!" }
    )
    }
  });
});

app.get('/', routes.index);

if (!module.parent) {
  app.listen(3000);
  console.log('Express server listening on port %d, environment: %s', app.get('port'), app.settings.env)
  console.log('Using connect %s, Express %s, Jade %s', connect.version, express.version, jade.version);
}
