/*!
* Favoritize.js by outaTiME
* Copyright 2012 Favoritize, Inc.
*/

$(function () {


  var

    /** Current section anchor point. **/
    _section,

    /** Easy scroll helper to use cross app. **/
    scrollHelper = function (section, callback) {
      section = section || _section || "#product_locator";
      // first time, not relocate
      $("html,body").animate(
        {
          scrollTop: $(section).offset().top - $(".test-fixed").height() - 18
        },
        400,
        'easeOutExpo',
        callback || $.noop
      );
      // store displacement
      _section = section;
    },

    reflow = function (callback) {

      callback = callback || $.noop;

      // reflow fixed header

      var
        box = $("body #home #box"),
        hPos = box.position(),
        hWidth = box.width(),
        fixed = $(".test-fixed", box),
        content = $(".tab-content", box);

      fixed.css({
        left: hPos.left + 1, // little pixel
        width: hWidth // no margins
      });

      content.css({
        marginTop: fixed.height()
      });

      // reflow "workeable" area

      var
        hHeight = $("header", box).outerHeight(),
        tHeight = $(".nav-tabs", box).outerHeight(),
        sections = $(".tab-pane.active section", box),
        sections_count = sections.length,
        wHeight = $(window).outerHeight(),
        pHeight = wHeight - hHeight - tHeight, // page size
        wResize = false;

      // console.info("Section count: %i", sections_count);

      // reset heights
      sections.css("height", "auto");

      // modify sections
      sections.each(function(index, value) {
        // if (index < sections_count - 1) {
          var sHeight = $(value).outerHeight(), pages = Math.ceil(sHeight / pHeight);
          /* console.log("Section: %s (%i), height: %i, separator space was: %i",
            $(value).attr("id"),
            index,
            sHeight,
            sHeight + pHeight); */
          $(value).css("height", sHeight + pHeight);
        /* } else {
          // console.log('Section: %s (%i), not resize required', $(value).attr("id"), index);
        } */
      });

      // execute callback

      callback();

    };

  /** Initials **/
  (function () {
    var a = $(window), c = $("#box");
  // center login / sign up
    if ($("body #home").length === 0) {
      var d = c.closest(".container");
      c.bind("center", function() {
        var e = a.height() - d.height() - 36; // 36 too from container padding
        var f = Math.floor(e / 2);
        if (f > 0) { // took from style
          d.css({marginTop: f});
        }
      }).trigger("center");
      a.resize(function(){
        $.doTimeout('resize', 250, function () {
          c.trigger("center");
        });
      });
    } else {
      reflow();
      a.resize(function(){
        $.doTimeout('resize', 250, reflow);
      });
    }
    // prevent reflow
    c.css({visibility: "visible"});
    // select first form element
    $("form :input:visible:enabled:first").select().focus();
  }());

  // login
  $("#login form, #signup form").submit(function (e) {
    // console.debug('Login / Signup form submit event...');
    var area = $("form .submit"), button = $("form button");
    // prevent iPhone issue
    area.css({height: button.outerHeight()});
    // e.preventDefault();
    $(":input:visible:enabled", this).attr("readonly", true); // no ajax
  });

  // home search
  $("#home form").submit(function (e) {
    // console.debug('Home form submit event...');
    e.preventDefault();
    var area = $("form .area"), button = $("form button"), keywords = $("#search #keywords");
    // prevent iPhone issue
    area.css({height: button.outerHeight()});
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
        $(resultId).html(data).show(0, function () {
          /* var result = $(this), position = result.offset().top -
            ($(window).outerHeight() - result.outerHeight()) + 18;
          console.log('Scroll to results, position: %i', position);
          scrollHelper(position); */
          reflow(function () {
            scrollHelper(resultId, function () {
              $(resultId).focus();
            });
          });
        });
        // window.location.hash = resultId; // smooth
        // $.smoothScroll({scrollTarget: resultId});
      },
      complete: function(jqXHR, textStatus) {
        button.show();
        keywords.attr("readonly", false).focus();
      }
    });
  });

  // buttons

  $("body").on("click", "#btn-cancel,#btn-try", function (event) {
    // console.debug('Cancel button click event fired...');
    scrollHelper("#product_locator", function () {
      $("#search #keywords").select().focus();
    });
  });

  $("body").on("click", "#btn-create", function (event) {
    // console.debug('Create button click event fired...');
    scrollHelper("#create");
  });

  $("body").on("click", "#btn-review", function (event) {
    // console.debug('Review button click event fired...');
    scrollHelper("#review");
  });

  $("body").on("click", ".nav-tabs a[data-toggle='tab']", function (event) {
    reflow(); // prevent resize issues
    // select first form element
    $("form :input:visible:enabled:first").select().focus();
  });

  // smooth scroll
  /* $(window).bind('hashchange', function(event) {
    var tgt = location.hash.replace(/^#\/?/,'');
    console.log("Smooth scrool, for: %s", tgt);
    if ( document.getElementById(tgt) ) {
      scrollHelper('#' + tgt);
      // $.smoothScroll({scrollTarget: '#' + tgt});
    }
  }); */

});
