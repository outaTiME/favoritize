
/*
 * GET home page.
 */

exports.home = function(req, res){
  res.render('home', {
  })
};

exports.test = function(req, res){
  res.render('test', {
    title: 'Test'
  })
};

