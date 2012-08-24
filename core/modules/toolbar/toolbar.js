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
      $(this).data('drupalToolbar', new Drupal.ToolBar($context, $(this)));
    });
    // Instantiate the toolbar tray.
    var $tray = $('.toolbar-tray');
    var $toggle = $('.toolbar-toggle-tray');
    $context.find('#toolbar').once('toolbar-slider', function (index, element) {
      $(this).data('drupalToolbar', new Drupal.TraySlider($context, $(this), $tray, $toggle));
    });
    // Toggling toolbar drawer.
    $context.find('#toolbar a.toggle').once('toolbar-toggle').click(function(e) {
      Drupal.toolbar.toggle();
      // Allow resize event handlers to recalculate sizes/positions.
      $(window).triggerHandler('resize');
      return false;
    });
  }
};

Drupal.ToolBar = function ($context, $toolbar) {
  this.init.apply(this, arguments);
};
/**
 * Retrieve last saved cookie settings and set up the initial toolbar state.
 */
Drupal.ToolBar.prototype.init = function ($context, $toolbar) {
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
Drupal.TraySlider = function ($context, $toolbar, $tray, $toggle) {
  this.$context = $context;
  this.$toolbar = $toolbar;
  this.$tray = $tray;
  this.$toggle = $toggle;
  
  this.init.apply(this, arguments);
};
/**
 *
 */
Drupal.TraySlider.prototype.init = function () {
  this.state = 'closed';
  this.collapse();
  
  this.$toggle
  .on('click.drupal-toolbar', $.proxy(this, 'toggle'));
};
/**
 *
 */
Drupal.TraySlider.prototype.toggle = function (event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  if (this.state === 'closed') {
    this.expand();
  }
  else {
    this.collapse();
  }
}
/**
 *
 */
Drupal.TraySlider.prototype.expand = function (event) {
  this.$tray.slideDown();
  this.state = 'open';
};
/**
 *
 */
Drupal.TraySlider.prototype.collapse = function () {
  this.$tray.slideUp();
  this.state = 'closed';
};

})(jQuery);
