/**
 * @file
 * A Backbone View that provides the app-level interactive menu.
 */
(function($, _, Backbone, Drupal) {

"use strict";

Drupal.edit = Drupal.edit || {};
Drupal.edit.views = Drupal.edit.views || {};
Drupal.edit.views.MenuView = Backbone.View.extend({

  /**
   * Implements Backbone Views' initialize() function.
   */
  initialize: function() {
    _.bindAll(this, 'stateChange');
    this.model.on('change:isViewing', this.stateChange);

    // We have to call stateChange() here, because URL fragments are not passed
    // the server, thus the wrong anchor may be marked as active.
    this.stateChange();
  },

  /**
   * Listens to app state changes.
   */
  stateChange: function() {
    // Unmark whichever one is currently marked as active.
    this.$('a.edit_view-edit-toggle')
      .removeClass('active')
      .parent().removeClass('active');

    // Mark the correct one as active.
    var activeAnchor = this.model.get('isViewing') ? 'view' : 'edit';
    this.$('a.edit_view-edit-toggle.edit-' + activeAnchor)
      .addClass('active')
      .parent().addClass('active');
  }
});

})(jQuery, _, Backbone, Drupal);
