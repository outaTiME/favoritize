
/**
 * Module dependencies.
 */

var

  // dependencies

  restify = require('restify'),
  express = require('express'),
  everyauth = require('everyauth'),
  routes = require('./routes'),

  /** Yay, out application name. */
  app_name = "Favoritize",

  /** Default login field value. **/
  login_value = "admin",

  /** Default password field value. **/
  password_value = "c%}YW34^86>7,xJ",

  /** Invitation code, only available in development mode. **/
  invitation_code = "93Q6$7=vF)b^/2V",

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
      url: getEnvironmentValue("http://localhost:3000", "http://api.favoritize.com"),
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
    client.head('/', function(err, req, res, obj) {
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
    console.log("Registration data: %j", newUserAttributes);
    var promise = this.Promise(), errors = [];
    if (newUserAttributes.invitation_code !== invitation_code) {
      errors.push("Unable to find the invitation code provided.");
    }
    return errors;
  })
  .registerUser( function (newUserAttributes) {
    var promise = this.Promise(), client = getApiClient();
    client.post('/users', newUserAttributes, function(err, req, res, data) {
      if (err) {
        console.log("User creation fail, error: %j", err);
        return promise.fulfill([err]);
      }
      console.log("User created. Data: %j", data);
      promise.fulfill(data);
    });
    return promise;
  })
  .respondToRegistrationSucceed( function (res, user, data) {
    if (user) {
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

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'foobar' }));
  app.use(express.bodyParser());
  app.use(everyauth.middleware());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

// helpers

app.helpers({
  loginFormFieldValue: getEnvironmentValue(login_value),
  passwordFormFieldValue: getEnvironmentValue(password_value),
  invitationCodeFormFieldValue: getEnvironmentValue(invitation_code)
});

app.dynamicHelpers({
  buildTitle: function(req, res) {
    return function (title) {
      var result = [app_name];
      if ("undefined" !== typeof title && title.length > 0) {
        result.push(title);
      }
      return result.join(", ");
    };
  }
});

everyauth.helpExpress(app);

// routes

app.get('/', checkAuth, routes.home);
app.get('/test', checkAuth, routes.test);

// environment specific

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// launcher

app.listen(process.env.PORT || 3001, function() {
  console.log("%s listening on port %d (%s mode)", app_name, app.address().port, app.settings.env);
});
