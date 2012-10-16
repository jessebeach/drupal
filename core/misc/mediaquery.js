(function (Drupal, $, _) {

"use strict";

var queries = {};
var attached = false;

Drupal.behaviors.mediaQueryGroup = {
  attach: function (context, settings) {
    $(window).on({
      'resize.mediaquery': _.debounce(_.bind(MediaQueryGroup.refresh, MediaQueryGroup), 400)
    });
  }
};

function MediaQueryGroup (mq) {
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
        if (Drupal.MediaQueryGroup.testMediaQuery(this.query)) {
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
 * Utility functions for the MediaQueryGroup object.
 */
$.extend(MediaQueryGroup, {
  queries: {},
  listQueries: function () {
    return this.queries;
  },
  testMediaQuery: function (query) {
    return this.matchMedia(this.query).matches;
  },
  refresh: function (event) {
    var query;
    for (query in this.queries) {
      if (this.queries.hasOwnProperty(query) && Drupal.MediaQueryGroup.testMediaQuery(query)) {
        this.queries[query].publish();
      }
    }
  }
});

$.extend(MediaQueryGroup.prototype, {

});

$.extend(Drupal, {'MediaQueryGroup': MediaQueryGroup});

}(Drupal, jQuery, _, matchMedia));
