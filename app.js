
/**
 * Module dependencies.
 */

var

  // dependencies

  restify = require('restify'),
  express = require('express'),
  everyauth = require('everyauth'),
  routes = require('./routes'),
  // gzip = require('connect-gzip'),
  gzippo = require('gzippo'),
  jade = require('jade'),
  path = require('path'),
  util = require('util'),
  mailer = require('mailer'),

  /** Yay, out application name. */
  app_name = "Favoritize",

  /** Default email sender. **/
  email_sender = "hello@favoritize.com",

  /** Default login field value. **/
  login_value = "afalduto@gmail.com",

  /** Default password field value. **/
  password_value = "ebd6f534736fed7c475d9c175abd024e",

  /** Invitation code, only available in development mode. **/
  invitation_code = "1515d5b65c8b446d6c152395d7d484bc",

  /** Get value only if running app in development mode, if not return empty (used by helpers). **/
  getEnvironmentValue = function(value, empty) {
    if (app.settings.env === "development") {
      return value;
    }
    return empty || "";
  },

  /** Get client instance for favoritize api call. */
  getApiClient = function (login, password) {
    // create new client for each request (statefull)
    var client = restify.createJsonClient({
      // url: getEnvironmentValue("http://localhost:3000", "http://api.favoritize.com"),
      url: "http://api.favoritize.com",
      version: '0.1.0'
    });
    if (arguments.length > 0) { // with auth ?
      client.basicAuth(login, password);
    }
    return client;
  },

  /** Check auth method, used in each express request. */
  checkAuth = function(req, res, next){
    if (req.loggedIn) {
      next();
    } else {
      req.session.redirect_to = req.url;
      res.redirect("/login");
    }
  },

  // email helper

  emails = {

    /** Send basic email. **/
    send: function(template, mailOptions, templateOptions) {
      jade.renderFile(path.join(__dirname, 'views', 'mailer', template), templateOptions, function(err, text) {
        if (!err) {
          // add the rendered Jade template to the mailOptions
          mailOptions.body = text;
          // merge the app's mail options
          var keys = Object.keys(app.set('mailOptions')), k;
          for (var i = 0, len = keys.length; i < len; i++) {
            k = keys[i];
            if (!mailOptions.hasOwnProperty(k)) {
              mailOptions[k] = app.set('mailOptions')[k]
            }
          }
          console.log('[SENDING MAIL]', util.inspect(mailOptions));
          // Only send mails in production
          if (app.settings.env === 'production') {
            mailer.send(mailOptions, function(err, result) {
              if (err) {
                console.log(err);
              }
            });
          }
        } else {
          console.log(err);
        }
      });
    },

    /** Send welcome mail. **/
    sendWelcome: function(user) {
      this.send(
        'welcome.jade',
        {
          to: user.email,
          subject: 'Welcome to Favoritize!'
        },
        {
          user: user
        }
      );
    }

  },

  // server

  app = module.exports = express.createServer();

// authorization

everyauth.password
  .loginWith('email')
  .getLoginPath('/login')
  .postLoginPath('/login')
  .loginView('login.jade')
  .loginLocals(function (req, res) {
    return {
      title: "Log In"
    };
   })
  .authenticate( function (login, password) {
    var promise = this.Promise(), client = getApiClient(login, password);
    client.get('/hi', function(err, req, res, obj) {
      if (err) {
        console.log("Authentication fail, error: %j", err);
        return promise.fulfill([err]);
      }
      console.log("User authenticated. Data: %j", obj);
      promise.fulfill(obj);
    });
    return promise;
  })
  .respondToLoginSucceed( function (res, user, data) {
    if (user) {
      // i dont want to implement everyauth findById, user object is too lightweight
      data.req.session.user = user;
      console.log("Store user object at session scope: %j", user);
      // proper redirection
      var redir_to = data.req.session.redirect_to;
      if (!redir_to || redir_to.length === 0) {
        redir_to = this.loginSuccessRedirect(); // prevent empty string
      }
      console.log("Login success, redirecting to: %s", redir_to);
      this.redirect(res, redir_to);
    }
  })
  .loginSuccessRedirect('/')
  .getRegisterPath('/signup')
  .postRegisterPath('/signup')
  .registerView('signup.jade')
  .registerLocals(function (req, res) {
    return {
      title: "Sign Up"
    };
  })
  .extractExtraRegistrationParams( function (req) {
    return {
      invitation_code: req.body.invitation_code,
      password_confirm: req.body.password_confirm
    };
  })
  .validateRegistration( function (newUserAttributes) {
    var promise = this.Promise(), errors = [];
    /* if (newUserAttributes.invitation_code !== invitation_code) {
      errors.push("Unable to find the invitation code provided.");
    } */
    return errors;
  })
  .registerUser( function (newUserAttributes) {
    console.log("Tying to register user using data: %j", newUserAttributes);
    var promise = this.Promise(), client = getApiClient();
    client.post('/users', newUserAttributes, function(err, req, res, data) {
      if (err) {
        console.log("User creation fail, error: %j", err);
        return promise.fulfill([err.message]);
      }
      console.log("User created. Data: %j", data);
      emails.sendWelcome(data);
      promise.fulfill(data);
    });
    return promise;
  })
  .respondToRegistrationSucceed( function (res, user, data) {
    if (user) {
      // i dont want to implement everyauth findById, user object is too lightweight
      data.req.session.user = user;
      console.log("Store user object at session scope: %j", user);
      // proper redirection
      var redir_to = data.req.session.redir_to;
      if (!redir_to || redir_to.length === 0) {
        redir_to = this.registerSuccessRedirect(); // prevent empty string
      }
      console.log("Registration success, redirecting to: %s", redir_to);
      this.redirect(res, redir_to);
    }
  })
  .registerSuccessRedirect('/'); // Where to redirect to after a successful registration

// configuration

;

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'foobar' }));
  app.use(express.bodyParser());
  app.use(everyauth.middleware());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/private', dest: __dirname + '/public' }));
  app.use(require('uglify-js-middleware')({ src : __dirname + '/private', dest: __dirname + '/public', uglyext: false }));
  app.use(app.router);
  // app.use(express.static(__dirname + '/public'));
  // app.use(gzippo.compress());
  // app.use(express.staticCache());
  app.use(gzippo.staticGzip(__dirname + '/public'));
  // app.use(connect.compress())
});

// helpers

everyauth.helpExpress(app);

app.helpers({
  loginFormFieldValue: getEnvironmentValue(login_value),
  passwordFormFieldValue: getEnvironmentValue(password_value),
  invitationCodeFormFieldValue: getEnvironmentValue(invitation_code)
});

app.dynamicHelpers({
  user: function(req, res) {
    var user = req.session.user;
    console.log("Resolve user from session: %j", user);
    return user;
  },
  getTitle: function(req, res) {
    return function (title) {
      var result = [app_name];
      if ("undefined" !== typeof title && title.length > 0) {
        result.push(title);
      }
      return result.join(", ");
    };
  }
});

// routes

app.get('/', checkAuth, routes.home);
app.get('/test', checkAuth, routes.test);

// ajax

app.post('/search', checkAuth, routes.search);

// environment specific

app.configure('development', function(){
  // app.use(gzip.staticGzip(__dirname + '/public'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  // email rules
  app.set('mailOptions', { // stubSMTP
    host: 'localhost',
    port: '1025',
    from: email_sender
  });
});

app.configure('production', function(){
  /* var oneYear = 31557600000;
  app.use(gzip.staticGzip(__dirname + '/public', { maxAge: oneYear })); */
  app.use(express.errorHandler());
  // email rules
  app.set('mailOptions', {
    host: 'smtp.sendgrid.net',
    port: '587',
    authentication: 'plain',
    username: process.env.SENDGRID_USERNAME,
    password: process.env.SENDGRID_PASSWORD,
    domain: 'heroku.com',
    from: email_sender
  });
});

// launcher

app.listen(process.env.PORT || 3001, function() {
  console.log("%s listening on port %d (%s mode)", app_name, app.address().port, app.settings.env);
});
