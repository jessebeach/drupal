/**
 * @file
 * A Backbone View that provides the app-level overlay.
 *
 * The overlay sits on top of the existing content, the properties that are
 * candidates for editing sit on top of the overlay.
 */
(function ($, _, Backbone, Drupal) {

"use strict";

Drupal.edit = Drupal.edit || {};
Drupal.edit.views = Drupal.edit.views || {};
Drupal.edit.views.OverlayView = Backbone.View.extend({

  events: {
    'click': 'onClick'
  },

  /**
   * Implements Backbone Views' initialize() function.
   */
  initialize: function(options) {
    _.bindAll(this, 'stateChange');
    this.model.on('change:isViewing', this.stateChange);
  },

  /**
   * Listens to app state changes.
   */
  stateChange: function() {
    if (this.model.get('isViewing')) {
      this.remove();
      return;
    }
    this.render();
  },

  /**
   * Equates clicks anywhere on the overlay to clicking the active editor's (if
   * any) "close" button.
   *
   * @param event
   */
  onClick: function(event) {
    event.preventDefault();
    var activeEditor = this.model.get('activeEditor');
    if (activeEditor) {
      var editableEntity = activeEditor.options.widget;
      var predicate = activeEditor.options.property;
      editableEntity.setState('candidate', predicate, { reason: 'overlay' });
    }
  },

  /**
   * Inserts the overlay element and appends it to the body.
   */
  render: function() {
    this.setElement(
      $(Drupal.theme('editOverlay', {}))
      .appendTo('body')
      .addClass('edit-animate-slow edit-animate-invisible')
    );
    // Animations
    this.$el.css('top', $('#navbar').outerHeight());
    this.$el.removeClass('edit-animate-invisible');
  },

  /**
   * Remove the overlay element.
   */
  remove: function() {
    var that = this;
    this.$el
    .addClass('edit-animate-invisible')
    .on(Drupal.edit.util.constants.transitionEnd, function (event) {
      that.$el.remove();
    });
  }
});

})(jQuery, _, Backbone, Drupal);
