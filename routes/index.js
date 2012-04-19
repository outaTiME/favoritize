
/**
 * Module dependencies.
 */

var

  aws = require('aws-lib'),

  /** Amazon access key id. **/
  aws_access_key_id = "AKIAJNP2M6VLA27BZ4RA",

  /** Amazon secret access key. **/
  aws_secret_access_key = "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",

  /** Amazon associate tag (only for product advertising api). **/
  aws_associate_tag = "favoritize-20",

  /** Return new AWS in each call. */
  getProductAdvertisingClient = function () {
    return aws.createProdAdvClient(aws_access_key_id, aws_secret_access_key, aws_associate_tag);
  }

// routes

exports.home = function (req, res) {
  res.render('home', {
  })
};

exports.test = function (req, res) {
  res.render('test', {
    title: 'Test'
  })
};

exports.search = function (req, res) {
  console.log("%j", req.params);
  console.log("%j", req.body);
  var prodAdv = getProductAdvertisingClient(), keywords = req.body["keywords"], items = [];
  console.log("Searching keywords at amazon: %s", keywords);
  prodAdv.call("ItemSearch", {SearchIndex: "All", Keywords: keywords}, function(err, result) {
    if (!err) {
      items = result.Items.Item;
    }
    console.log('Items: %j', items);
    res.partial("search", {
      items: items
    });
  });

};

