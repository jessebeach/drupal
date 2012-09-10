(function ($, undefined) {

"use strict";

/**
 * Attach toggling behavior and notify the overlay of the toolbar.
 */
Drupal.behaviors.toolbar = {
  attach: function(context, settings) {
    var $toolbar = $(context).find('#toolbar');
    var $bar = $toolbar.find('.toolbar-bar');
    var $tray = $toolbar.find('.toolbar-tray');
    var $trigger = $toolbar.find('.toggle-tray');
    // Set the initial state of the toolbar.
    $bar.once('toolbar-bar', function (index, element) {
      var $toolbar = $(this);
      $toolbar.data('drupalToolbar', new Drupal.ToolBar($toolbar));
    });
    // Instantiate the toolbar tray.
    $tray.once('toolbar-slider', function (index, element) {
      var $tray = $(this);
      $tray.data('drupalToolbar', new Drupal.TraySlider($tray, $trigger));
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
 * Extend the prototype of the TraySlider class.
 */
$.extend(Drupal.ToolBar.prototype, {
  /**
   *
   */
  init: function() {
    // Labels
    this.labels = {
      'opened': Drupal.t('Hide shortcuts'),
      'closed': Drupal.t('Show shortcuts')
    };
    // Recalculate the offset top on screen resize.
    var setHeight = $.proxy(this, 'setHeight');
    // Use debounce if it exists.
    setHeight = ('debounce' in Drupal) ? Drupal.debounce(setHeight, 250) : setHeight;
    $(window)
      .on({
        'resize.DrupalToolbar': setHeight
      });
    // Toolbar event handlers.
    this.$toolbar
      .on({
        'setup.DrupalToolbar': setHeight
      })
      .trigger('setup');
    // Set up the toolbar drawer visibility toggle.
    /*
  this.$trigger = this.$toolbar.find('.toggle-drawer');
    this.$trigger
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
  */
  },
  /**
   * Collapse the toolbar.
   */
  collapse: function() {
    var toggle_text = this.labels.closed;
    this.$drawer.addClass('collapsed');
    this.$trigger
    .removeClass('active')
    .attr('title',  toggle_text)
    .html(toggle_text);
    // Remove the class from the body that would indicate the drawer is open.
    $('body')
    .removeClass('toolbar-drawer');
    // Set the height of the toolbar.
    this.setHeight();
  },
  /**
   * Expand the toolbar.
   */
  expand: function() {
    var toggle_text = this.labels.opened;
    this.$drawer.removeClass('collapsed');
    this.$trigger
    .addClass('active')
    .attr('title',  toggle_text)
    .html(toggle_text);
    // Add a class to the body to indicate the drawer is open.
    $('body').addClass('toolbar-drawer');
    // Set the height of the toolbar.
    this.setHeight();
  },
  /**
   * Toggle the toolbar.
   */
  toggle: function(event) {
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
  },
  /**
   *
   */
  setHeight: function() {
    this.height = this.$toolbar.outerHeight();
    this.$toolbar.attr('data-offset-top', this.height);
    // Alter the padding on the top of the body element.
    // @todo, this should be moved to drupal.js and register for
    // the offsettopchange event.
    $('body').css('paddingTop', this.height);
    $(document).trigger('offsettopchange');
  }
});
/**
 *
 */
Drupal.TraySlider = function ($tray, $trigger) {
  this.$tray = $tray;
  this.$trigger = $trigger;
  this.state;
  this.width;
  this.maxWidth;
  // Init the object.
  this.init.apply(this, arguments);
};
/**
 * Extend the prototype of the TraySlider class.
 */
$.extend(Drupal.TraySlider.prototype, {
  /**
   *
   */
  init: function () {
    this.state = 'closed';
    this.ui = {
      'activeClass': 'active',
      'trayOpenBodyClass': 'menu-tray-open'
    };
    // Add a click handler to the toggle.
    this.$trigger
      .on({
        'setup.DrupalToolbar': $.proxy(this, 'toggleTrigger'),
        'click.DrupalToolbar': $.proxy(this, 'handleTriggerClick'),
        'toggled.DrupalToolbar': $.proxy(this, 'toggleTrigger')
      })
      .trigger('setup', this.state);
    this.$tray
      // Register event handlers.
      .on({
        'setup.DrupalToolbar': $.proxy(this, 'displace'),
        'toggled.DrupalToolbar': $.proxy(this, 'toggleTray')
      })
      // The tray will be positioned at the edge of the window.
      .addClass('positioned')
      // Triger setup.
      .trigger('setup', this.state);
    // Register for offsettopchange events.
    $(document)
      .on({
        // Offset value vas changed by a third party script.
        'offsettopchange.DrupalToolbar': $.proxy(this, 'displace')
      });
  },
  /**
   *
   */
  handleTriggerClick: function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.state = (this.state === 'closed') ? 'open' : 'closed';
    this.$tray.trigger('toggled', this.state);
    this.$trigger.trigger('toggled', this.state);
  },
  /**
   *
   */
   toggleTrigger: function (event, state) {
    this.$trigger[((state === 'open') ? 'add' : 'remove') + 'Class'](this.ui.activeClass);
  },
  /**
   *
   */
  toggleTray: function (event, state) {
    this.$tray[((state === 'open') ? 'add' : 'remove') + 'Class'](this.ui.activeClass);
    // Add a class to the body so it can be styled to react to the tray.
    $('body')[((state === 'open') ? 'add' : 'remove') + 'Class'](this.ui.trayOpenBodyClass);
  },
  /**
   *
   */
  displace: function (event) {
    console.log(this.computeOffsetTop());
    this.$tray
    .position({
      'my': 'left top',
      'at': 'left top', /* LTR */
      'offset': '0 ' + this.computeOffsetTop() + 'px',
      'of': window
    });
  },
  /**
   * Sum all [data-offset-top] values and cache it.
   * @todo move this out of tableheader.js into a move generic place like drupal.js.
   */
  computeOffsetTop: function () {
    var $offsets = $('[data-offset-top]');
    var value, sum = 0;
    for (var i = 0, il = $offsets.length; i < il; i++) {
      value = parseInt($offsets[i].getAttribute('data-offset-top'), 10);
      sum += !isNaN(value) ? value : 0;
    }
    this.offsetTop = sum;
    return sum;
  }
});
})(jQuery);
