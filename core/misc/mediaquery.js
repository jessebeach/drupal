window.matchMedia = window.matchMedia || (function( doc, undefined ) {

  "use strict";

  var bool,
      docElem = doc.documentElement,
      refNode = docElem.firstElementChild || docElem.firstChild,
      // fakeBody required for <FF4 when executed in <head>
      fakeBody = doc.createElement( "body" ),
      div = doc.createElement( "div" );

  div.id = "mq-test-1";
  div.style.cssText = "position:absolute;top:-100em";
  fakeBody.style.background = "none";
  fakeBody.appendChild(div);

  return function(q){

    div.innerHTML = "&shy;<style media=\"" + q + "\"> #mq-test-1 { width: 42px; }</style>";

    docElem.insertBefore( fakeBody, refNode );
    bool = div.offsetWidth === 42;
    docElem.removeChild( fakeBody );

    return {
      matches: bool,
      media: q
    };

  };

}( document ));


(function (Drupal, $, _) {

"use strict";

var queries = {};
var attached = false;

Drupal.behaviors.mediaquery = {
  attach: function (context, settings) {
    $(window).on({
      'resize.mediaquery': _.debounce(_.bind(MediaQuery.refresh, MediaQuery), 400)
    });
  }
};

function MediaQuery (mq) {
  var callbacks;
  // If the supplied mq is a property of queries, just return queries[mq].
  var query = mq && queries[mq];
  if (!query) {
    callbacks = $.Callbacks('unique');
    query = {
      query: mq,
      publish: function () {
        callbacks.fireWith(this, arguments);
      },
      subscribe: function () {
        callbacks.add.apply(this, arguments);
        // If the media query applies when the callbacks are added, fire them.
        if (Drupal.MediaQuery.testMediaQuery(this.query)) {
          for (var i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] === 'function') {
              // The callback might be a bound function, so don't change the
              // context. Just call it.
              arguments[i]();
            }
          }
        }
      },
      unsubscribe: callbacks.remove
    };
    if (mq) {
      queries[mq] = query;
    }
  }
  return query;
}
/**
 * Utility functions for the MediaQuery object.
 */
$.extend(MediaQuery, {
  listQueries: function () {
    return queries;
  },
  testMediaQuery: function (query) {
    return matchMedia(query).matches;
  },
  refresh: function (event) {
    var query;
    for (query in queries) {
      if (queries.hasOwnProperty(query) && Drupal.MediaQuery.testMediaQuery(query)) {
        queries[query].publish();
      }
    }
  }
});

$.extend(Drupal, {'MediaQuery': MediaQuery});

}(Drupal, jQuery, _, matchMedia));
