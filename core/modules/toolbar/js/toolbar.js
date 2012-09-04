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
    var $toggle = $toolbar.find('.toggle-tray');
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
  this.$toggle = this.$toolbar.find('.toggle-drawer');
  this.$toggle
  .on('click.DrupalToolbar', $.proxy(this, 'toggle'));
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
  .removeClass('active')
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
  .addClass('active')
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
  this.maxWidth;
  // Init the object.
  this.init.apply(this, arguments);
};
/**
 *
 */
Drupal.TraySlider.prototype.init = function () {
  this.state = 'closed';
  this.maxWidth = 200;
  this.width = this.getWidth();
  // Place the menu off screen.
  this.$tray.css({
    'width': this.width,
    'left': this.width * -1
  });
  // Add a click handler to the toggle.
  this.$toggle
  .on('click.DrupalToolbar', $.proxy(this, 'toggle'));
  // Register for offsettopchange events.
  $(document)
  .on({
    // Offset value vas changed by a third party script.
    'offsettopchange.DrupalToolbar': $.proxy(this, 'displace')
  });
  this.displace();
  // Turn on flexiPanda
  this.$tray.find('.toolbar-menu > .menu').flexiPanda({
    debug: false,
    mode: 'accordion'
  });
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
  this.width = this.getWidth();
  this.$tray.animate({
    'width': this.width,
    'left': 0
  });
  $('body').animate({
    'padding-left': this.width
  });
  this.state = 'open';
};
/**
 *
 */
Drupal.TraySlider.prototype.collapse = function () {
  this.$tray.animate({
    'left': this.width * -1
  });
  $('body').animate({
    'padding-left': 0
  });
  this.state = 'closed';
};
/**
 *
 */
Drupal.TraySlider.prototype.displace = function (event) {
  this.$tray.css({
    'top': this.computeOffsetTop()
  });
};
/**
 * Sum all [data-offset-top] values and cache it.
 * @todo move this out of tableheader.js into a move generic place like drupal.js.
 */
Drupal.TraySlider.prototype.computeOffsetTop = function () {
  var $offsets = $('[data-offset-top]');
  var value, sum = 0;
  for (var i = 0, il = $offsets.length; i < il; i++) {
    value = parseInt($offsets[i].getAttribute('data-offset-top'), 10);
    sum += !isNaN(value) ? value : 0;
  }
  this.offsetTop = sum;
  return sum;
};
/**
 *
 */
Drupal.TraySlider.prototype.getWidth = function (event) {
  var maxClient = document.documentElement.clientWidth;
  var candidate = maxClient * 0.9;
  var width = (candidate > this.maxWidth) ? this.maxWidth : candidate;
  return width;
};


})(jQuery);
