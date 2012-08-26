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
      var $this = $(this);
      $this.data('drupalToolbar', new Drupal.ToolBar($this));
    });
    // Instantiate the toolbar tray.
    $tray.once('toolbar-slider', function (index, element) {
      var $this = $(this);
      $this.data('drupalToolbar', new Drupal.TraySlider($this, $toggle));
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
  this.$toolbar
  .find('a.toggle')
  .on('click', $.proxy(this, 'toggle'));
  // Retrieve the collapsed status from a stored cookie.
  this.collapsed = $.cookie('Drupal.toolbar.collapsed');
  // Expand or collapse the toolbar based on the cookie value.
  if (this.collapsed === '1') {
    this.collapse();
  }
  else {
    this.expand();
  }
  // Set the height
  this.setHeight();
};
/**
 * Collapse the toolbar.
 */
Drupal.ToolBar.prototype.collapse = function() {
  var toggle_text = this.labels.closed;
  $('.toolbar-drawer', this.$toolbar).addClass('collapsed');
  $('a.toggle', this.$toolbar)
  .removeClass('toggle-active')
  .attr('title',  toggle_text)
  .html(toggle_text);
  //
  $('body')
  .removeClass('toolbar-drawer')
  .css('paddingTop', this.setHeight());
  //
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
  var toggle_text = this.labels.opened;
  $('#toolbar div.toolbar-drawer').removeClass('collapsed');
  $('#toolbar a.toggle')
    .addClass('toggle-active')
    .attr('title',  toggle_text)
    .html(toggle_text);
  $('body').addClass('toolbar-drawer').css('paddingTop', this.setHeight());
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

Drupal.ToolBar.prototype.setHeight = function() {
  this.height = this.$toolbar.outerHeight();
  this.$toolbar.attr('data-offset-top', this.height);
  return this.height;
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
