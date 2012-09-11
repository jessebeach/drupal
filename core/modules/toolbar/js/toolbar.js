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
  // Initiate the object.
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
  // The tray has a couple setup methods to run.
  var setup = $.Callbacks();
  setup.add($.proxy(this, 'renderAccordion'));
  setup.add($.proxy(this, 'displace'));
  this.$tray
    // Register event handlers.
    .on({
      'setup.DrupalToolbar': setup.fire,
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
};
/**
 * Extend the prototype of the TraySlider class.
 */
$.extend(Drupal.TraySlider.prototype, {
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
    this.$tray.css({
      'top': this.computeOffsetTop() + 'px'
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
  },
  /**
   * Accordion behavior.
   */
  renderAccordion: function (event) {
    event.stopPropagation();
    var context = this;
    this.$tray.find('.toolbar-menu > .menu').each(function (index, element) {
      var $root = $(this).addClass('root');
        // Wrap the list in a div to provide a positioning context.
      var $wrapper = $root.wrap($('<div>')
        .css({
            height: '100%',
            position: 'relative'
          })
          .addClass('fleximenu')
        )
        .parent()
        // Bind event handlers.
        .on({
          'setup.DrupalToolbar': context.accordionSetup
        });
      // Create a set of list-manipulation callbacks.
      // Called when items are added or removed.
      var listUpdate = $.Callbacks();
      // Set visibility
      listUpdate.add(context.initItems);
      listUpdate.add($.proxy(context, 'markListLevels', $root));
      listUpdate.add($.proxy(context, 'setLevelVisibility', $root, 1));
      $wrapper
        .on('listChange.DrupalToolbar', listUpdate.fire)
        .on('clean.DrupalToolbar.accordionMode', 'li', context.cleanItem)
        .on('activate.DrupalToolbar.accordionMode', 'li', context.activateItem)
        .on('click.DrupalToolbar.accordionMode', '.handle', context.accordionToggle)
        .trigger('setup');
    });
  },
  accordionSetup: function (event) {
    event.stopPropagation();
    // Mark up the lists and items.
    $(this)
    .trigger('listChange');

  },
  cleanItem: function (event) {},
  activateItem: function (event) {},
  accordionToggle: function (event) {
    // The toggle.
    var $toggle = $(this);
    var $item = $toggle.closest('li');
    var $list = $item.children('ul');
    var isHidden = $list.hasClass('dormant');
    // Toggle the item open state.
    $item
      [((isHidden) ? 'add' : 'remove') + 'Class']('open');
    // Toggle the item list visibility.
    $list
      ['slide' + ((isHidden) ? 'Down' : 'Up')]()
      [((isHidden) ? 'remove' : 'add') + 'Class']('dormant');
    // Twist the toggle.
    $toggle
      [((isHidden) ? 'add' : 'remove') + 'Class']('open');

  },
  initItems: function (event) {
    // The accordion wrapper.
    var $wrapper = $(this);
    var rootClass = 'root';
    var boxClass = 'box';
    var handleClass = 'handle';
    // Get lists and items.
    var $root = $wrapper.children('.' + rootClass);
    var $ul = $wrapper.find('ul').once('fleximenu');
    var $li = $wrapper.find('li').once('fleximenu');
    // Basic setup
    $ul
      .each(function (index, element) {
        $(this).data('DrupalToolbar', {
          processed: false,
          type: 'list',
          level: NaN
        });
      });
    // Initialize items and their links.
    $li
      .each(function (index, element) {
        $(this).data('DrupalToolbar', {
          processed: false,
          type: 'item'
        });
      })
      // Add a class to item links.
      .children('a')
      .wrap(
        $('<div>', {
          'class': boxClass
        })
      )
      .end()
      // Add a handle to each list item if it has a menu.
      .each(function (index, element) {
        var $item = $(this);
        if ($item.children('ul').length > 0) {
          $item
            .children('.' + boxClass)
            .prepend(
              $('<span>', {
                'class': handleClass,
                text: ''
              })
            );
        }
      });
  },
  /**
   * Adds a level class to each list based on its depth in the menu.
   */
  markListLevels: function ($lists, level, event) {
    level = (typeof level === 'object') ? 1 : level;
    $lists
    .addClass('level-' + level)
    .each(function (index, element) {
      $(this).data().DrupalToolbar.level = level;
    });
    $lists = $lists.children('li').children('ul');
    if ($lists.length > 0) {
      this.markListLevels($lists, (level + 1));
    }
  },
  setLevelVisibility: function ($lists, visibleAfter) {
    var level;
    $lists
    .each(function (index, element) {
      var $this = $(this);
      level = $(this).data().DrupalToolbar.level;
      if (level > visibleAfter) {
        $this.addClass('dormant');
      }
      else {
        $this.addClass('visible');
      }
    });
    $lists = $lists.children('li').children('ul');
    if ($lists.length > 0) {
      this.setLevelVisibility($lists, visibleAfter);
    }
  }
});
}(jQuery));
