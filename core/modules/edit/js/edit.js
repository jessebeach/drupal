/**
 * @file
 * Behaviors for Edit, including the one that initializes Edit's EditAppView.
 */
(function ($, Backbone, Drupal) {

"use strict";

Drupal.edit = Drupal.edit || {};

Drupal.behaviors.editDiscoverEditables = {
  attach: function(context) {
    // @todo BLOCKED_ON(VIE.js, how to let VIE know that some content was removed and how to scan new content for VIE entities, to make them editable?)
    // Also see ToolbarView.save().
    // We need to separate the discovery of editables if we want updated
    // or new content (added by code other than Edit) to be detected
    // automatically. Once we implement this, we'll be able to get rid of all
    // calls to Drupal.edit.domService.findSubjectElements() :)
  }
};

/**
 * Attach toggling behavior and in-place editing.
 */
Drupal.behaviors.edit = {
  attach: function(context) {
    $('#edit_view-edit-toggles').once('edit-init', Drupal.edit.init);

    // As soon as there is at least one editable field, show the Edit tab in the
    // toolbar.
    if ($(context).find('.edit-field.edit-allowed').length) {
      $('.toolbar .icon-edit.edit-nothing-editable-hidden').removeClass('edit-nothing-editable-hidden');
    }
  }
};

Drupal.edit.init = function() {
  // Instantiate EditAppView, which is the controller of it all. EditAppModel
  // instance tracks global state (viewing/editing in-place).
  var appModel = new Drupal.edit.models.EditAppModel();
  var app = new Drupal.edit.EditAppView({
    el: $('body'),
    model: appModel
  });

  // Instantiate EditRouter.
  var editRouter = new Drupal.edit.routers.EditRouter({
    appModel: appModel
  });

  // Start Backbone's history/route handling.
  Backbone.history.start();
};

})(jQuery, Backbone, Drupal);
