(function (Drupal, _) {

"use strict";

Drupal.behaviors.mediaQueryGroup = {
  attach: function (context, settings) {
    var addEventListener = window.addEventListener || window.attachEvent;
    if (addEventListener) {
      window.addEventListener('resize', _.debounce(_.bind(MediaQueryGroup.refresh, MediaQueryGroup), 400));
    }
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
_.extend(MediaQueryGroup, {
  fallback: 'default',
  groups: {},
  queries: [],
  listQueries: function () {
    return this.queries;
  },
  listGroups: function () {
    return this.groups;
  },
  test: function (query) {
    return matchMedia(query).matches;
  },
  refresh: function (event) {
    var refreshed = [];
    var e = event;
    var query, group, i, callbacks, c;
    for (i = 0; i <this.queries.length; i++) {
      query = this.queries[i];
      if (this.test(query)) {
        for (group in this.groups) {
          if (this.groups.hasOwnProperty(group) && (query in this.groups[group].queries)) {
            refreshed.push(group);
            if (this.groups[group].lastFired !== query) {
              callbacks = this.groups[group].queries[query];
              for (c = 0; c < callbacks.length; c++) {
                callbacks[c].call(window, e);
              }
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
        callbacks = defaulters[group].queries[this.fallback];
        for (c = 0; c < callbacks.length; c++) {
          callbacks[c].call(window, e);
        }
        this.groups[group].lastFired = this.fallback;
      }
    }
  },
  queryAdd: function (mq) {
    if (mq !== this.fallback) {
      this.queries.push(mq);
    }
  },
  /**
   * Cycle through all this.groups and see if this was the last instance of
   * the media query. If so, remove it from this.queries.
   */
  queryRemove: function (mq) {
    if (mq !== this.fallback) {
      var query, group, i, index;
      for (group in this.groups) {
        if (this.groups.hasOwnProperty(group) && (mq in this.groups[group].queries)) {
          return;
        }
      }
      // If no groups have the mq in their list of queries, remove it from the
      // master list.
      index = this.queries.indexOf(mq);
      this.queries.splice(index, 1);
    }
  }
});

_.extend(MediaQueryGroup.prototype, {
  namespace: '',
  queries: {},
  lastFired: '',
  add: function (mq, callback) {
    if (!(mq && this.queries[mq])) {
      this.queries[mq] = [];
      // Add the mq to the global list of queries.
      Drupal.MediaQueryGroup.queryAdd(mq);
    }
    this.queries[mq].push(callback);
    // If the media query applies when the callback is added, invoke it.
    if (Drupal.MediaQueryGroup.test(mq) || (mq === Drupal.MediaQueryGroup.fallback && this.lastFired.length === 0)) {
      // The callback might be a bound function, so don't change the
      // context. Just call it.
      callback();
      this.lastFired = mq;
    }
  },
  remove: function (property) {
    var mq, callback, i, index;
    // The property is a media query.
    if (typeof property === 'string') {
      if (property in this.queries) {
        delete this.queries[property];
        // Attempt to remove the media query from the master list.
        Drupal.MediaQueryGroup.queryRemove(property);
        return true;
      }
    }
    // The property is a callback.
    if (typeof property === 'function') {
      callback = property;
      for (mq in this.queries) {
        if (this.queries.hasOwnProperty(mq)) {
          index = this.queries[mq].indexOf(callback);
          if (index > -1) {
            this.queries[mq].splice(index, 1);
            if (this.queries[mq].length === 0) {
              delete this.queries[mq];
            }
            // Attempt to remove the media query from the master list.
            Drupal.MediaQueryGroup.queryRemove(mq);
            return true;
          }
        }
      }
    }
    // Return false if nothing was removed.
    return false;
  }
});

_.extend(Drupal, {'MediaQueryGroup': MediaQueryGroup});

}(Drupal, _));
