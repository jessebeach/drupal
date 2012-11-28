/**
 * @file
 * A Backbone View that is the central app controller.
 */
(function ($, _, Backbone, Drupal, VIE) {

"use strict";

  Drupal.edit = Drupal.edit || {};
  Drupal.edit.EditAppView = Backbone.View.extend({
    vie: null,
    domService: null,

    // Configuration for state handling.
    states: [],
    activeEditorStates: [],
    singleEditorStates: [],

    // State.
    $entityElements: [],

    /**
     * Implements Backbone Views' initialize() function.
     */
    initialize: function() {
      _.bindAll(this, 'appStateChange', 'acceptEditorStateChange', 'editorStateChange');

      // VIE instance for Edit.
      this.vie = new VIE();
      // Use our custom DOM parsing service until RDFa is available.
      this.vie.use(new this.vie.EditService());
      this.domService = this.vie.service('edit');

      // Instantiate configuration for state handling.
      this.states = [
        null, 'inactive', 'candidate', 'highlighted',
        'activating', 'active', 'changed', 'saving', 'saved', 'invalid'
      ];
      this.activeEditorStates = ['activating', 'active'];
      this.singleEditorStates = _.union(['highlighted'], this.activeEditorStates);

      // Use Create's Storage widget.
      this.$el.createStorage({
        vie: this.vie,
        editableNs: 'createeditable'
      });

      // Instantiate an EditableEntity widget for each property.
      var that = this;
      this.$entityElements = this.domService.findSubjectElements().each(function() {
        $(this).createEditable({
          vie: that.vie,
          disabled: true,
          state: 'inactive',
          acceptStateChange: that.acceptEditorStateChange,
          statechange: function(event, data) {
            that.editorStateChange(data.previous, data.current, data.propertyEditor);
          },
          decoratePropertyEditor: function(data) {
            that.decorateEditor(data.propertyEditor);
          }
        });
      });

      // Instantiate OverlayView
      var overlayView = new Drupal.edit.views.OverlayView({
        model: this.model
      });

      // Instantiate MenuView
      var editMenuView = new Drupal.edit.views.MenuView({
        el: this.el,
        model: this.model
      });

      // When view/edit mode is toggled in the menu, update the editor widgets.
      this.model.on('change:isViewing', this.appStateChange);

      // Document events.
      $(document).on('keyup.edit', this.returnToStandby);
    },

    /**
     * Sets the state of PropertyEditor widgets when edit mode begins or ends.
     *
     * Should be called whenever EditAppModel's "isViewing" changes.
     */
    appStateChange: function() {
      // @todo: BLOCKED_ON(Create.js, https://github.com/bergie/create/issues/133, https://github.com/bergie/create/issues/140)
      // We're currently setting the state on EditableEntity widgets instead of
      // PropertyEditor widgets, because of
      // https://github.com/bergie/create/issues/133.
      var newState = (this.model.get('isViewing')) ? 'inactive' : 'candidate';
      this.$entityElements.each(function() {
        $(this).createEditable('setState', newState);
      });
      // Re-index that page's tab indexes.
      if (newState === 'candidate') {
        this._manageDocumentFocus();
      }
      else {
        this._releaseDocumentFocusManagement();
      }
    },

    /**
     * Accepts or reject editor (PropertyEditor) state changes.
     *
     * This is what ensures that the app is in control of what happens.
     *
     * @param from
     *   The previous state.
     * @param to
     *   The new state.
     * @param predicate
     *   The predicate of the property for which the state change is happening.
     * @param context
     *   The context that is trying to trigger the state change.
     * @param callback
     *   The callback function that should receive the state acceptance result.
     */
    acceptEditorStateChange: function(from, to, predicate, context, callback) {
      var accept = true;

      // If the app is in view mode, then reject all state changes except for
      // those to 'inactive'.
      if (this.model.get('isViewing')) {
        if (to !== 'inactive') {
          accept = false;
        }
      }
      // Handling of edit mode state changes is more granular.
      else {
        // In general, enforce the states sequence. Disallow going back from a
        // "later" state to an "earlier" state, except in explicitly allowed
        // cases.
        if (_.indexOf(this.states, from) > _.indexOf(this.states, to)) {
          accept = false;
          // Allow: activating/active -> candidate.
          // Necessary to stop editing a property.
          if (_.indexOf(this.activeEditorStates, from) !== -1 && to === 'candidate') {
            accept = true;
          }
          // Allow: changed/invalid -> candidate.
          // Necessary to stop editing a property when it is changed or invalid.
          else if ((from === 'changed' || from === 'invalid') && to === 'candidate') {
            accept = true;
          }
          // Allow: highlighted -> candidate.
          // Necessary to stop highlighting a property.
          else if (from === 'highlighted' && to === 'candidate') {
            accept = true;
          }
          // Allow: saved -> candidate.
          // Necessary when successfully saved a property.
          else if (from === 'saved' && to === 'candidate') {
            accept = true;
          }
          // Allow: invalid -> saving.
          // Necessary to be able to save a corrected, invalid property.
          else if (from === 'invalid' && to === 'saving') {
            accept = true;
          }
        }

        // If it's not against the general principle, then here are more
        // disallowed cases to check.
        if (accept) {
          // Ensure only one editor (field) at a time may be higlighted or active.
          if (from === 'candidate' && _.indexOf(this.singleEditorStates, to) !== -1) {
            if (this.model.get('highlightedEditor') || this.model.get('activeEditor')) {
              accept = false;
            }
          }
          // Reject going from activating/active to candidate because of a
          // mouseleave.
          else if (_.indexOf(this.activeEditorStates, from) !== -1 && to === 'candidate') {
            if (context && context.reason === 'mouseleave') {
              accept = false;
            }
          }
          // When attempting to stop editing a changed/invalid property, ask for
          // confirmation.
          else if ((from === 'changed' || from === 'invalid') && to === 'candidate') {
            if (context && context.reason === 'mouseleave') {
              accept = false;
            }
            else {
              // Check whether the transition has been confirmed?
              if (context && context.confirmed) {
                accept = true;
              }
              // Confirm this transition.
              else {
                // The callback will be called from the helper function.
                this._confirmStopEditing(callback);
                return;
              }
            }
          }
        }
      }

      callback(accept);
    },

    /**
     * Asks the user to confirm whether he wants to stop editing via a modal.
     *
     * @param acceptCallback
     *   The callback function as passed to acceptEditorStateChange(). This
     *   callback function will be called with the user's choice.
     *
     * @see acceptEditorStateChange()
     */
    _confirmStopEditing: function(acceptCallback) {
      // Only instantiate if there isn't a modal instance visible yet.
      if (!this.model.get('activeModal')) {
        var that = this;
        var modal = new Drupal.edit.views.ModalView({
          model: this.model,
          message: Drupal.t('You have unsaved changes'),
          buttons: [
            { action: 'discard', classes: 'gray-button', label: Drupal.t('Discard changes') },
            { action: 'save', classes: 'blue-button', label: Drupal.t('Save') }
          ],
          callback: function(action) {
            // The active modal has been removed.
            that.model.set('activeModal', null);
            if (action === 'discard') {
              acceptCallback(true);
            }
            else {
              acceptCallback(false);
              var editor = that.model.get('activeEditor');
              editor.options.widget.setState('saving', editor.options.property);
            }
          }
        });
        this.model.set('activeModal', modal);
        // The modal will set the activeModal property on the model when rendering
        // to prevent multiple modals from being instantiated.
        modal.render();
      }
      else {
        // Reject as there is still an open transition waiting for confirmation.
        acceptCallback(false);
      }
    },

    /**
     * Reacts to editor (PropertyEditor) state changes; tracks global state.
     *
     * @param from
     *   The previous state.
     * @param to
     *   The new state.
     * @param editor
     *   The PropertyEditor widget object.
     */
    editorStateChange: function(from, to, editor) {
      // @todo: BLOCKED_ON(Create.js, https://github.com/bergie/create/issues/133)
      // Get rid of this once that issue is solved.
      if (!editor) {
        return;
      }
      else {
        editor.stateChange(from, to);
      }

      // Keep track of the highlighted editor in the global state.
      if (_.indexOf(this.singleEditorStates, to) !== -1 && this.model.get('highlightedEditor') !== editor) {
        this.model.set('highlightedEditor', editor);
      }
      else if (this.model.get('highlightedEditor') === editor && to === 'candidate') {
        this.model.set('highlightedEditor', null);
      }

      // Keep track of the active editor in the global state.
      if (_.indexOf(this.activeEditorStates, to) !== -1 && this.model.get('activeEditor') !== editor) {
        this.model.set('activeEditor', editor);
      }
      else if (this.model.get('activeEditor') === editor && to === 'candidate') {
        this.model.set('activeEditor', null);
      }

      // Propagate the state change to the decoration and toolbar views.
      // @todo: BLOCKED_ON(Create.js, https://github.com/bergie/create/issues/133)
      // Uncomment this once that issue is solved.
      // editor.decorationView.stateChange(from, to);
      // editor.toolbarView.stateChange(from, to);
    },

    /**
     * Decorates an editor (PropertyEditor).
     *
     * Upon the page load, all appropriate editors are initialized and decorated
     * (i.e. even before anything of the editing UI becomes visible; even before
     * edit mode is enabled).
     *
     * @param editor
     *   The PropertyEditor widget object.
     */
    decorateEditor: function(editor) {
      // Toolbars are rendered "on-demand" (highlighting or activating).
      // They are a sibling element before the editor's DOM element.
      editor.toolbarView = new Drupal.edit.views.ToolbarView({
        editor: editor,
        $storageWidgetEl: this.$el
      });

      // Decorate the editor's DOM element depending on its state.
      editor.decorationView = new Drupal.edit.views.PropertyEditorDecorationView({
        el: editor.element,
        editor: editor,
        toolbarId: editor.toolbarView.getId()
      });

      // @todo: BLOCKED_ON(Create.js, https://github.com/bergie/create/issues/133)
      // Get rid of this once that issue is solved.
      editor.options.widget.element.on('createeditablestatechange', function(event, data) {
        editor.decorationView.stateChange(data.previous, data.current);
        editor.toolbarView.stateChange(data.previous, data.current);
      });
    },
    /**
     * Makes elements other than the editables unreachable via the tab key.
     *
     * @param context
     *   The part of the DOM that should have its tabindexes changed. Defaults
     *   to the entire page.
     */
    _manageDocumentFocus: function () {
      var editablesSelector = '.edit-candidate.edit-editable';
      var inputsSelector = 'a:visible, input:visible, textarea:visible, select:visible';
      var $editables = $(editablesSelector)
        .attr({
          'tabindex': 0,
          'role': 'button'
        });
      // Store the first editable in the set.
      var $currentEditable;
      // We're using simple function scope to manage 'this' for the internal
      // handler, so save this as that.
      var that = this;
      // Turn on focus management.
      $(document).on('keyup.edit', function (event) {
        var activeEditor, editableEntity, predicate;
        // Handle esc key press. Close any active editors.
        if (event.keyCode === 27) {
          event.preventDefault();
          activeEditor = that.model.get('activeEditor');
          if (activeEditor) {
            editableEntity = activeEditor.options.widget;
            predicate = activeEditor.options.property;
            editableEntity.setState('candidate', predicate, { reason: 'overlay' });
          }
          else {
            $(editablesSelector).trigger('tabOut.edit');
            // This should move into the state management for the app model.
            location.hash = "#view";
            that.model.set('isViewing', true);
          }
          return;
        }
        // Handle enter or space key presses.
        if (event.keyCode === 13 || event.keyCode === 32) {
          if ($currentEditable.is(editablesSelector)) {
            $currentEditable.trigger('click');
            // Squelch additional handlers.
            event.preventDefault();
            return;
          }
        }
        // Handle tab key presses.
        if (event.keyCode === 9) {
          var context = '';
          var selector = editablesSelector;
          activeEditor = that.model.get('activeEditor');
          if (activeEditor) {
            context = $(activeEditor.$formContainer).add(activeEditor.toolbarView.$el);
            selector = inputsSelector;
            if (!$currentEditable || $currentEditable.is(editablesSelector)) {
              $currentEditable = $(selector, context).eq(-1);
            }
          }
          var $editables = $(selector, context);
          if (!$currentEditable) {
            $currentEditable = $editables.eq(-1);
          }
          var count = $editables.length - 1;
          var index = $editables.index($currentEditable);
          // Navigate backwards.
          if (event.shiftKey) {
            // Beginning of the set, loop to the end.
            if (index === 0) {
              index = count;
            }
            else {
              index -= 1;
            }
          }
          // Navigate forewards.
          else {
            // End of the set, loop to the start.
            if (index === count) {
              index = 0;
            }
            else {
              index += 1;
            }
          }
          // Tab out of the current editable.
          $currentEditable.trigger('tabOut.edit');
          // Update the current editable.
          $currentEditable = $editables
            .eq(index)
            .focus()
            .trigger('tabIn.edit');
          // Squelch additional handlers.
          event.preventDefault();
          event.stopPropagation();
        }
      });
    },
    /**
     * Restores the original tabindex value of a group of elements.
     *
     * @param context
     *   The part of the DOM that should have its tabindexes restored. Defaults
     *   to the entire page.
     */
    _releaseDocumentFocusManagement: function (context) {
      $(document).off('.edit');
      $('.edit-candidate.edit-editable').removeAttr('tabindex role');
    }
  });

})(jQuery, _, Backbone, Drupal, VIE);
