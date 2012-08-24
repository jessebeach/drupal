(function ($) {

"use strict";

Drupal.toolbar = Drupal.toolbar || {};

/**
 * Attach toggling behavior and notify the overlay of the toolbar.
 */
Drupal.behaviors.toolbar = {
  attach: function(context, settings) {
    var $context = $(context);
    // Set the initial state of the toolbar.
    $context.find('#toolbar').once('toolbar', function (index, element) {
      $(this).data('drupalToolbar', new Drupal.ToolBar(this));
    });

      // Set the initial state of the toolbar.
      Drupal.toolbar.init();

      $(window).on('resize.toolbar', Drupal.toolbar.height);

      // Toggling toolbar drawer.
      $toolbar.find('a.toggle').once('toolbar-toggle').click(function(e) {
        e.preventDefault();
        Drupal.toolbar.toggle();
        // Allow resize event handlers to recalculate sizes/positions.
        $(window).triggerHandler('resize');
      });
    }
  }
};

Drupal.ToolBar = function (context) {
  this.init.apply(this, arguments);
};
/**
 * Retrieve last saved cookie settings and set up the initial toolbar state.
 */
Drupal.ToolBar.prototype.init = function (toolbar) {
  // Retrieve the collapsed status from a stored cookie.
  var collapsed = $.cookie('Drupal.toolbar.collapsed');

  // Expand or collapse the toolbar based on the cookie value.
  if (collapsed === '1') {
    this.collapse();
  }
  else {
    this.expand();
  }
  
};
/**
 * Collapse the toolbar.
 */
Drupal.ToolBar.prototype.collapse = function() {
  var toggle_text = Drupal.t('Show shortcuts');
  $('#toolbar div.toolbar-drawer').addClass('collapsed');
  $('#toolbar a.toggle')
    .removeClass('toggle-active')
    .attr('title',  toggle_text)
    .html(toggle_text);
  $('body').removeClass('toolbar-drawer').css('paddingTop', this.height());
  $.cookie(
    'Drupal.toolbar.collapsed',
    1,
    {
      path: Drupal.settings.basePath,
      // The cookie should "never" expire.
      expires: 36500
    }
  );
  Drupal.toolbar.height();
  $(document).trigger('offsettopchange');
};

/**
 * Expand the toolbar.
 */
Drupal.ToolBar.prototype.expand = function() {
  var toggle_text = Drupal.t('Hide shortcuts');
  $('#toolbar div.toolbar-drawer').removeClass('collapsed');
  $('#toolbar a.toggle')
    .addClass('toggle-active')
    .attr('title',  toggle_text)
    .html(toggle_text);
  $('body').addClass('toolbar-drawer').css('paddingTop', this.height());
  $.cookie(
    'Drupal.toolbar.collapsed',
    0,
    {
      path: Drupal.settings.basePath,
      // The cookie should "never" expire.
      expires: 36500
    }
  );
  Drupal.toolbar.height();
  $(document).trigger('offsettopchange');
};

/**
 * Toggle the toolbar.
 */
Drupal.ToolBar.prototype.toggle = function() {
  if ($('#toolbar div.toolbar-drawer').hasClass('collapsed')) {
    this.expand();
  }
  else {
    this.collapse();
  }
};

Drupal.ToolBar.prototype.height = function() {
  var $toolbar = $('#toolbar');
  var height = $toolbar.outerHeight();
  $toolbar.attr('data-offset-top', height);
  return height;
};
/**
 *
 */
Drupal.TraySlider = function (context) {
  
};
})(jQuery);
