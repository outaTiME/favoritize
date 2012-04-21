
$(function () {

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

  // smooth scroll
  $(window).bind('hashchange', function(event) {
    var tgt = location.hash.replace(/^#\/?/,'');
    console.log("Smooth scrool, for: %s", tgt);
    if ( document.getElementById(tgt) ) {
      $.smoothScroll({scrollTarget: '#' + tgt});
    }
  });

  // FIXME: [outaTiME] disable textfields from login / signup when submit
  /* $("#search").submit(function (e) {
    keywords.attr("disabled", true); // no ajax
  }); */

  // home search
  $("#search").submit(function (e) {
    e.preventDefault();
    var button = $("form button"), keywords = $("#search #keywords");
    button.hide();
    keywords.attr("disabled", true);
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
        keywords.attr("disabled", false).focus();
      }
    });
  });

});
