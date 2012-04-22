
$(function () {

  // center login / sign up
  if ($("body #home").length === 0) {
    var a = $(window), c = $("#box"), d = c.closest(".container");
    c.bind("center", function() {
      var e = a.height() - d.height() - 36; // 36 too from container padding
      var f = Math.floor(e / 2);
      if (f > 0) { // took from style
        d.css({marginTop: f});
      }
    }).trigger("center");
    a.resize(function() {
      c.trigger("center");
    })
    // prevent reflow
    c.css({visibility: "visible"});
  }

  // select first form element
  $("form :input:visible:enabled:first").focus();

  // login
  $("#login form, #signup form").submit(function (e) {
    console.debug('Login / Signup form submit event...');
    // e.preventDefault();
    $(":input:visible:enabled", this).attr("readonly", true); // no ajax
  });

  // home search
  $("#home form").submit(function (e) {
    console.debug('Home form submit event...');
    e.preventDefault();
    var button = $("form button"), keywords = $("#search #keywords");
    button.hide();
    keywords.attr("readonly", true);
    $.ajax({
      type: "POST",
      url: '/search',
      // dataType: "json",
      data: {
        keywords: keywords.val()
      },
      error: function (xhr, status) {
        console.error(status);
      },
      success: function(data, textStatus, jqXHR) {
        var resultId = '#search-result';
        $(resultId).html(data).show();
        // window.location.hash = resultId; // smooth
        $.smoothScroll({scrollTarget: resultId});
      },
      complete: function(jqXHR, textStatus) {
        button.show();
        keywords.attr("readonly", false).focus();
      }
    });
  });

  // smooth scroll
  $(window).bind('hashchange', function(event) {
    var tgt = location.hash.replace(/^#\/?/,'');
    console.log("Smooth scrool, for: %s", tgt);
    if ( document.getElementById(tgt) ) {
      $.smoothScroll({scrollTarget: '#' + tgt});
    }
  });

});
