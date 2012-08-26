(function ($) {

"use strict";

Drupal.toolbar = Drupal.toolbar || {};

/**
 * Attach toggling behavior and notify the overlay of the toolbar.
 */
Drupal.behaviors.toolbar = {
  attach: function(context, settings) {
    var $toolbar = $(context).find('#toolbar');
    var $bar = $toolbar.find('.toolbar-bar');
    var $tray = $toolbar.find('.toolbar-tray');
    var $toggle = $toolbar.find('.toolbar-toggle-tray');
    // Set the initial state of the toolbar.
    $bar.once('toolbar-bar', function (index, element) {
      var $toolbar = $(this);
      $toolbar.data('drupalToolbar', new Drupal.ToolBar($toolbar));
    });
    // Instantiate the toolbar tray.
    $tray.once('toolbar-slider', function (index, element) {
      var $tray = $(this);
      $tray.data('drupalToolbar', new Drupal.TraySlider($tray, $toggle));
    });
  }
};

Drupal.ToolBar = function ($toolbar) {
  this.$toolbar = $toolbar;
  this.labels;
  this.collapsed;
  // Init the object.
  this.init.apply(this, arguments);
};
/**
 *
 */
Drupal.ToolBar.prototype.init = function() {
  // Labels
  this.labels = {
    'opened': Drupal.t('Hide shortcuts'),
    'closed': Drupal.t('Show shortcuts')
  };
  // Set up the toolbar drawer visibility toggle.
  this.$toggle = this.$toolbar.find('a.toggle');
  this.$toggle
  .on('click', $.proxy(this, 'toggle'));
  // Store the shortcut bar drawer HTML element.
  this.$drawer = this.$toolbar.find('.toolbar-drawer');
  // Retrieve the collapsed status from a stored cookie.
  this.collapsed = $.cookie('Drupal.toolbar.collapsed');
  // Expand or collapse the toolbar based on the cookie value.
  if (this.collapsed === '1') {
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
  var toggle_text = this.labels.closed;
  this.$drawer.addClass('collapsed');
  this.$toggle
  .removeClass('toggle-active')
  .attr('title',  toggle_text)
  .html(toggle_text);
  // Remove the class from the body that would indicate the drawer is open.
  $('body')
  .removeClass('toolbar-drawer');
  // Set the height of the toolbar.
  this.setHeight();
};

/**
 * Expand the toolbar.
 */
Drupal.ToolBar.prototype.expand = function() {
  var toggle_text = this.labels.opened;
  this.$drawer.removeClass('collapsed');
  this.$toggle
  .addClass('toggle-active')
  .attr('title',  toggle_text)
  .html(toggle_text);
  // Add a class to the body to indicate the drawer is open.
  $('body').addClass('toolbar-drawer');
  // Set the height of the toolbar.
  this.setHeight();
};

/**
 * Toggle the toolbar.
 */
Drupal.ToolBar.prototype.toggle = function(event) {
  event.preventDefault();
  if (this.collapsed === '1') {
    this.expand();
    this.collapsed = '0';
  }
  else {
    this.collapse();
    this.collapsed = '1';
  }
  // Store the drawer state in a cookie.
  $.cookie(
    'Drupal.toolbar.collapsed',
    this.collapsed,
    {
      path: Drupal.settings.basePath,
      // The cookie should "never" expire.
      expires: 36500
    }
  );
};

Drupal.ToolBar.prototype.setHeight = function() {
  this.height = this.$toolbar.outerHeight();
  this.$toolbar.attr('data-offset-top', this.height);
  // Alter the padding on the top of the body element.
  // @todo, this should be moved to drupal.js and register for
  // the offsettopchange event.
  $('body').css('paddingTop', this.height);
  $(document).trigger('offsettopchange');
};
/**
 *
 */
Drupal.TraySlider = function ($tray, $toggle) {
  this.$tray = $tray;
  this.$toggle = $toggle;
  this.state;
  this.width;
  // Init the object.
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
