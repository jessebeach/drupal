(function (Drupal, $, _) {

"use strict";

Drupal.behaviors.mediaQueryGroup = {
  attach: function (context, settings) {
    $(window).on({
      'resize.mediaquery': _.debounce(_.bind(MediaQueryGroup.refresh, MediaQueryGroup), 400)
    });
  }
};

function MediaQueryGroup (namespace) {
  if (!namespace) {
    throw new Error("MediaQueryGroup: a namespace must be provided to create a MediaQueryGroup instance.");
  }
  this.namespace = namespace;
  Drupal.MediaQueryGroup.groups[namespace] = this;
}
/**
 * Utility functions for the MediaQueryGroup object.
 */
$.extend(MediaQueryGroup, {
  fallback: 'default',
  groups: {},
  queries: [],
  list: function () {
    return this.queries;
  },
  test: function (query) {
    return matchMedia(query).matches;
  },
  refresh: function (event) {
    var refreshed = [];
    var query, group;
    for (var i = 0; i <this.queries.length; i++) {
      query = this.queries[i];
      if (this.test(query)) {
        for (group in this.groups) {
          if (this.groups.hasOwnProperty(group) && (query in this.groups[group].queries)) {
            refreshed.push(group);
            if (this.groups[group].lastFired !== query) {
              this.groups[group].queries[query].fire();
              this.groups[group].lastFired = query;
            }
          }
        }
      }
    }
    // Run the default callback on any group that wasn't refreshed.
    var defaulters = _.omit(this.groups, refreshed);
    for (group in defaulters) {
      if (defaulters.hasOwnProperty(group) && (this.fallback in defaulters[group].queries) && defaulters[group].lastFired !== this.fallback) {
        defaulters[group].queries[this.fallback].fire();
        this.groups[group].lastFired = this.fallback;
      }
    }
  },
  queryAdd: function (mq) {
    this.queries.push(mq);
  },
  queryRemove: function (mq) {
    /* Cycle through all this.groups and see if this was the last instance of
    the mq. If so, remove it from this.queries. */
  }
});

$.extend(MediaQueryGroup.prototype, {
  namespace: '',
  queries: {},
  lastFired: '',
  add: function (mq, callback) {
    var callbacks = mq && this.queries[mq];
    if (!callbacks) {
      callbacks = this.queries[mq] = $.Callbacks('unique');
      // Add the mq to the global list of queries.
      if (mq !== Drupal.MediaQueryGroup.fallback) {
        Drupal.MediaQueryGroup.queryAdd(mq);
      }
    }
    callbacks.add(callback);
    // If the media query applies when the callback is added, invoke it.
    // @TODO the fallback should not be invoked if a valid MQ is registered
    // with this instance and it applies.
    if (Drupal.MediaQueryGroup.test(mq) || mq === Drupal.MediaQueryGroup.fallback) {
      // The callback might be a bound function, so don't change the
      // context. Just call it.
      callback();
      this.lastFired = mq;
    }
  },
  remove: function (callback) {
    this.callbacks.remove(callback);
  }
});

$.extend(Drupal, {'MediaQueryGroup': MediaQueryGroup});

}(Drupal, jQuery, _, matchMedia));
