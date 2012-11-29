/**
 * @file
 * Behaviors for Edit, including the one that initializes Edit's EditAppView.
 */
(function ($, Backbone, Drupal) {

"use strict";

/**
 * The edit ARIA live message area.
 *
 * @todo Eventually the messages area should be converted into a Backbone View
 * that will respond to changes in the application's model. For the initial
 * implementation, we will call the Drupal.edit.setMessage method when an aural
 * message should be read by the user agent.
 */
var $messages;

Drupal.edit = Drupal.edit || {};

Drupal.behaviors.editDiscoverEditables = {
  attach: function(context) {
    // @todo BLOCKED_ON(VIE.js, how to let VIE know that some content was
    // removed and how to scan new content for VIE entities, to make them
    // editable?)
    //
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
  // Append a messages element for appending interaction updates for screen
  // readers.
  $messages = $(Drupal.theme('editMessageBox')).appendTo(this);
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

/**
 * Places the message in the edit ARIA live message area.
 *
 * The message will be read by speaking User Agents.
 *
 * @param {String} message
 *   A string to be inserted into the message area.
 */
Drupal.edit.setMessage = function (message) {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('editMessage');
  $messages.html(Drupal.theme.apply(this, args));
}

/**
 * A region to post messages that a screen reading UA will announce.
 *
 * @return {String}
 *   A string representing a DOM fragment.
 */
Drupal.theme.editMessageBox = function () {
  return '<div id="edit-messages" class="element-invisible" role="region" aria-live="polite"></div>';
};

/**
 * Wrap message strings in p tags.
 *
 * @return {String}
 *   A string representing a DOM fragment.
 */
Drupal.theme.editMessage = function () {
  var messages = Array.prototype.slice.call(arguments);
  var output = '';
  for (var i = 0; i < messages.length; i++) {
   output += '<p>' + messages[i] + '</p>';
  }
  return output;
};
})(jQuery, Backbone, Drupal);
