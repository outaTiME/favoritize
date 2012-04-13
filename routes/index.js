
/*
 * GET home page.
 */

exports.home = function(req, res){
  res.render('home', {
    title: 'Favoritize'
  })
};

exports.test = function(req, res){
  res.render('test', {
    title: 'Favoritize, Test'
  })
};

