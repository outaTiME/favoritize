
$(function () {


  var

    /** Current section anchor point. **/
    _section,

    getSectionHeight = function (section) {
      return $(section).outerHeight() + 18 * 2; // with margins
    },

    /** Easy scroll helper to use cross app. **/
    scrollHelper = function (section, callback) {
      section = section || _section || "#product_locator";
      // first time, not relocate
      $("html,body").animate(
        {
          scrollTop: $('.scrollable').offset().top
        },
        400,
        'easeOutExpo'
      );​
      // niiiiceeee scroll
      var container = $('.scrollable'), scrollTo = $(section);
      container.animate(
        {
          scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop() - 18,
          height: getSectionHeight(section)
        },
        400,
        'easeOutExpo',
        callback || function () {}
      );​
      // store displacement
      _section = section;
    },

    /* reflow = function (section, callback) {
      console.log('Reflow for: %s', section);
      var container = $('.scrollable');
      container.animate(
        {
          height: getSectionHeight(section)
        },
        400,
        'easeOutExpo',
        callback || function() {}
      );
    }, */

    /** Get max height from sections. **/
    getMaxHeight = function () {
      var result = 0;
      $("body #home #box section").each(function(index, value) {
        var height = $(value).outerHeight();
        if (height > result) {
          result = height;
        }
      });
      return result;
    },

    reflow = function (section, animate) {
      // reset heights
      $("body #home #box section").css("height", "auto");

      console.info("Reflow over %i sections", $("body #home #box section").length);

      var
        hHeight = $("body #home #box header").outerHeight(),
        tHeight = $("body #home #box .nav-tabs").outerHeight(),
        fHeight = $("body #home #box footer").outerHeight(),
        // sHeight = getMaxHeight(),
        sHeight = $(section).outerHeight(),
        pHeight = hHeight + tHeight + (sHeight + 18 * 2) + fHeight + (18 * 2),
        wHeight = $(window).outerHeight(),
        wResize = false;

      // console.info("Max section height: %o", sHeight);
      console.info("Current section height: %o", sHeight);
      console.info("Projected height: %s", pHeight);
      console.info("Window height: %s", wHeight);

      if (wHeight > pHeight && wHeight == true) {
        var stretch = wHeight - pHeight + sHeight;
        console.info("Sections must be stretched to: %s", stretch);
        // $("body #home #box section").height(stretch);
        $(section).height(stretch);
        if (animate === false) {
          $("body #home #box .scrollable").height(stretch + 18 * 2); // add margins
          console.info("Initial or resize, direct reflow perfomed");
      }
      } else {
        console.info("No stretch for sections required!");
        // $("body #home #box section").height(sHeight);
        $(section).height(sHeight);
      }

      if (animate !== false) {
        // smooth resize and scroll if required
        scrollHelper(section, function () {
          console.info ("Full reflow performed");
        });
      }

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
      reflow("#product_locator", false);
      a.resize(function(){
        $.doTimeout('resize', 250, function () {
          reflow(_section || "#product_locator", true);
        });
      });
    }
    // prevent reflow
    c.css({visibility: "visible"});
    // select first form element
    $("form :input:visible:enabled:first").focus();
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
          reflow("#product_locator");
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

  $("body").on("click", "#btn-cancel", function (event) {
    // console.debug('Cancel button click event fired...');
    scrollHelper("#product_locator");
  });

  $("body").on("click", "#btn-create", function (event) {
    // console.debug('Create button click event fired...');
    scrollHelper("#create");
  });

  $("body").on("click", "#btn-review", function (event) {
    // console.debug('Review button click event fired...');
    scrollHelper("#review");
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
