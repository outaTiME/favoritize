
/**
 * Module dependencies.
 */

var
  express = require('express'),
  everyauth = require('everyauth'),
  routes = require('./routes'),
  app = module.exports = express.createServer(),
  restify = require('restify'),
  client = restify.createJsonClient({
    url: 'http://api.favoritize.com',
    version: '0.1.0'
  });

// auth

everyauth.password
  .loginWith('email')
  .getLoginPath('/login') // Uri path to the login page
  .postLoginPath('/login') // Uri path that your login form POSTs to
  .loginView('login.jade')
  .loginLocals(function (req, res) {
    return {
      title: "Log In",
      redir_to: req.query["redir_to"]
    };
   })
  .authenticate( function (login, password) {
    var promise = this.Promise();
    client.get('/', function(err, req, res, obj) {
      if (err) {
        console.log("Authentication fail, error: %j", err);
        return promise.fulfill([err]);
      }
      console.log("User authenticated. Data: %j", obj);
      promise.fulfill(obj);
    });
    return promise;


    // Either, we return a user or an array of errors if doing sync auth.
    // Or, we return a Promise that can fulfill to promise.fulfill(user) or promise.fulfill(errors)
    // `errors` is an array of error message strings
    //
    // e.g.,
    // Example 1 - Sync Example
    // if (usersByLogin[login] && usersByLogin[login].password === password) {
    //   return usersByLogin[login];
    // } else {
    //   return ['Login failed'];
    // }
    //
    // Example 2 - Async Example
    // var promise = this.Promise()
    // YourUserModel.find({ login: login}, function (err, user) {
    //   if (err) return promise.fulfill([err]);
    //   promise.fulfill(user);
    // }
    // return promise;
  })
  .respondToLoginSucceed( function (res, user, data) {
    console.log("respondToLoginSucceed");
    if (user) {
      var redir_to = data.req.body.redir_to;
      if (!redir_to || redir_to.length === 0) {
        redir_to = this.loginSuccessRedirect(); // prevent empty string
      }
      this.redirect(res, redir_to);
    }
  })
  .loginSuccessRedirect('/') // Where to redirect to after a login

    // If login fails, we render the errors via the login view template,
    // so just make sure your loginView() template incorporates an `errors` local.
    // See './example/views/login.jade'

  .getRegisterPath('/signup') // Uri path to the registration page
  .postRegisterPath('/signup') // The Uri path that your registration form POSTs to
  .registerView('signup.jade')
  .registerLocals(function (req, res) {
    return {
      title: "Sign Up"
    };
   })
  .validateRegistration( function (newUserAttributes) {
    // Validate the registration input
    // Return undefined, null, or [] if validation succeeds
    // Return an array of error messages (or Promise promising this array)
    // if validation fails
    //
    // e.g., assuming you define validate with the following signature
    // var errors = validate(login, password, extraParams);
    // return errors;
    //
    // The `errors` you return show up as an `errors` local in your jade template
  })
  .registerUser( function (newUserAttributes) {
    // This step is only executed if we pass the validateRegistration step without
    // any errors.
    //
    // Returns a user (or a Promise that promises a user) after adding it to
    // some user store.
    //
    // As an edge case, sometimes your database may make you aware of violation
    // of the unique login index, so if this error is sent back in an async
    // callback, then you can just return that error as a single element array
    // containing just that error message, and everyauth will automatically handle
    // that as a failed registration. Again, you will have access to this error via
    // the `errors` local in your register view jade template.
    // e.g.,
    // var promise = this.Promise();
    // User.create(newUserAttributes, function (err, user) {
    //   if (err) return promise.fulfill([err]);
    //   promise.fulfill(user);
    // });
    // return promise;
    //
    // Note: Index and db-driven validations are the only validations that occur
    // here; all other validations occur in the `validateRegistration` step documented above.
  })
  .registerSuccessRedirect('/'); // Where to redirect to after a successful registration

// Configuration

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

everyauth.helpExpress(app);

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

var checkAuth = function(req, res, next){
  console.log("User logged: %s", req.loggedIn);
  if (req.loggedIn) {
    next();
  } else {
    res.redirect('/login?redir_to=' + encodeURIComponent(req.url));
  }
}

// Routes

app.get('/', checkAuth, routes.home);
app.get('/test', checkAuth, routes.test);

app.listen(process.env.PORT || 3001, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
