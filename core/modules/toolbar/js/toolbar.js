/**
 * @file toolbar.js
 *
 * Defines the behavior of the Drupal administration toolbar.
 */
(function ($, _) {

"use strict";

Drupal.toolbar = Drupal.toolbar || {};
var transitionEnd = "transitionEnd.toolbar webkitTransitionEnd.toolbar transitionend.toolbar msTransitionEnd.toolbar oTransitionEnd.toolbar";

/**
 * Attach toggling behavior and notify the overlay of the toolbar.
 */
Drupal.behaviors.toolbar = {
  attach: function(context, settings) {
    var options = _.extend(this.options, ('toolbar' in settings) ? settings.toolbar : {});
    var $toolbar = $(context).find('#toolbar').once('toolbar');
    if ($toolbar.length) {
      $toolbar
      .addClass('toolbar-main')
      .on('trayregistered', decorateInteractiveMenu);
      var toolbar = new ToolBar($toolbar, options);
      var tray, $tray, $trays, tab, $tab, $tabs, name, i;
      // Register trays.
      Drupal.toolbar.trays = [];
      $trays = $toolbar.find('.tray');
      for (i = 0; i < $trays.length; i++) {
        $tray = $($trays[i]);
        tray = new Tray($tray);
        Drupal.toolbar.trays.push(tray);
        $tray.data('toolbar', {
          'tray': tray
        });
        toolbar.registerTray(tray);
      }
      // Associate the bar tabs with the trays.
      Drupal.toolbar.tabs = [];
      $tabs = $toolbar.find('.bar .tab');
      for (i = 0; i < $tabs.length; i++) {
        $tab = $($tabs[i]);
        tab = new Tab($tab);
        Drupal.toolbar.tabs.push(tab);
        name = tab.$el.data().toolbarTray || '';
        if (name.length) {
          tray = toolbar.getTray(name);
          $tab.data('toolbar', {
            'tab': tab
          });
          tab.registerTray(tray);
          toolbar.registerTab(tab);
        }
      }
      // Set up switching between the vertical and horizontal presentation
      // of the toolbar trays based on a breakpoint.
      if (options.breakpoints && options.breakpoints['module.toolbar.wide'] !== undefined) {
        var mql = matchMedia(options.breakpoints['module.toolbar.wide']);
        mql.addListener(toolbar.mediaQueryChangeHandler);
        toolbar.mediaQueries.push(mql);
        if (mql.matches) {
          toolbar.mediaQueryChangeHandler(mql);
        }
      }
    }
  },
  options: {
    breakpoints: null
  }
};
/**
 * A toolbar is an administration action button container.
 */
function ToolBar ($toolbar, options) {
  this.$toolbar = $toolbar;
  this.$bar = $toolbar.find('.bar');
  this.height = 0;
  this.barHeight = 0;
  this.trays = [];
  this.tabs = [];
  this.activeTab = null;
  this.mediaQueries = [];
  this.ui = {
    'activeClass': 'active',
    'trayOpenBodyClass': 'toolbar-tray-open',
  };
  // Bind all ToolBar methods to the instance.
  _.bindAll(this);
  // Recalculate the offset top on screen resize.
  // Use throttle to prevent setHeight from being called too frequently.
  var setHeight = _.debounce(this.setHeight, 250);
  $(window)
    .on({
      'resize.toolbar': setHeight
    });
  // Toolbar event handlers.
  this.$toolbar
    .on('setup.toolbar', this.setHeight)
    .on('click.toolbar', '.bar .tab', this.toggleTray)
    .on('click.toolbar', '.tray .toggle-orientation button', this.orientationChangeHandler)
    .on(transitionEnd, '.tray.active', this.setHeight)
    .trigger('setup.toolbar');
};
/**
 * Extend the prototype of the ToolBar class.
 */
$.extend(ToolBar.prototype, {
  /**
   * The height of the toolbar offsets the top of the page content.
   *
   * Page components can register with the offsettopchange event to know when
   * the height of the toolbar changes.
   */
  setHeight: function (event) {
    var height = 0;
    var tray, $tray, $trays, trayH;
    this.barHeight = this.$bar.outerHeight();
    var bhpx = this.barHeight + 'px';
    height += this.barHeight;
    // Set the top of the all the trays to the height of the bar.
    $trays = this.$toolbar.find('.tray');
    for (var i = $trays.length - 1; i >= 0; i--) {
      tray = $trays[i];
      if (!tray.style.top.length || (tray.style.top !== bhpx)) {
        tray.style.top = bhpx;
      }
    };
    // Get the height of the active horizontal tray and include it in the total
    // height of the toolbar.
    $tray = $trays.filter('.active.horizontal');
    if ($tray.length > 0) {
      var trayH = $tray.outerHeight();
      height += trayH;
    }
    // Indicate the height of the toolbar in the attribute data-offset-top.
    if (this.height !== height) {
      this.height = height;
      this.$toolbar.attr('data-offset-top', height);
      // Alter the padding on the top of the body element.
      $('body').css('padding-top', height);
      $(document).trigger('offsettopchange', height);
      $(window).triggerHandler('resize');
    }
  },
  /**
   *
   */
  registerTray: function (tray) {
    this.trays.push(tray);
    this.$toolbar.trigger('trayregistered', tray);
  },
  /**
   *
   */
  toggleTray: function (event) {
    var $tab = $(event.target);
    var tab = $tab.data('toolbar').tab;
    if (tab.tray) {
      event.preventDefault();
      var disableTabs = _.without(this.tabs, tab);
      for (var i = disableTabs.length - 1; i >= 0; i--) {
        if (disableTabs[i]) {
          disableTabs[i].toggle(false);
        }
      };
      tab.toggle();
      this.activeTab = (tab.active) ? tab : null;
      this.setBodyState();
      this.setHeight();
      this.$toolbar.trigger('traytoggled', tab.tray);
    }
  },
  /**
   *
   */
  getTray: function (name) {
    for (var i = 0; i < this.trays.length; i++) {
      if (this.trays[i].name === name) {
        return this.trays[i];
      }
    }
    return;
  },
  /**
   *
   */
  registerTab: function (tab) {
    this.tabs.push(tab);
    this.$toolbar.trigger('tabregistered', tab);
  },
  /**
   *
   */
  orientationChangeHandler: function (event) {
    var $button = $(event.target);
    var orientation = event.target.value;
    var tray = $button.closest('.tray').data('toolbar').tray;
    this.changeOrientation(tray, orientation, true);
    this.setBodyState();
    this.setHeight();
    this.$toolbar.trigger('toolbarorientationchanged', orientation);
  },
  /**
   *
   */
  mediaQueryChangeHandler: function (mql) {
    var orientation = (mql.matches) ? 'horizontal' : 'vertical';
    this.changeOrientation(this.trays, orientation);
    this.setBodyState();
    this.setHeight();
    this.$toolbar.trigger('toolbarorientationchanged', orientation);
  },
  /**
   *
   */
  changeOrientation: function (trays, orientation, isOverride) {
    trays = (!_.isArray(trays)) ? [trays] : trays;
    for (var i = trays.length - 1; i >= 0; i--) {
      trays[i].changeOrientation(orientation, isOverride);
    };
  },
  /**
   *
   */
  setBodyState: function () {
    var $body = $('body')
      .removeClass('toolbar-vertical toolbar-horizontal');
    if (this.activeTab) {
      $body
        .addClass('toolbar-tray-open')
        .addClass('toolbar-' + this.activeTab.tray.getOrientation());
    }
    else {
      $body
        .removeClass('toolbar-tray-open');
    }
  }
});

/**
 * Toolbar tray.
 */
function Tray ($tray) {
  this.$el = $tray;
  this.name = this.$el.data()['toolbarTray'] || this.$el.attr('id') ||'no name';
  this.active = false;
  this.orientation = 'vertical';
  this.isOrientationLocked = false;
  this.setup.apply(this, arguments);
}

/**
 * Extend the prototype of the Tray.
 */
_.extend(Tray.prototype, {
  /**
   *
   */
  setup: function () {
    this.$el
      .addClass(this.orientation)
      .find('.lining')
      .append(Drupal.theme('toolbarOrientationToggle'));
    this.toggleOrientationToggle();
    this.setHeight();
  },
  /**
   *
   */
  toggle: function (open) {
    this.$el.toggleClass('active', open);
  },
  /**
   *
   */
  changeOrientation: function (orientation, isOverride) {
    if (isOverride && orientation === 'vertical') {
      this.isOrientationLocked = true;
    }
    if (isOverride && orientation === 'horizontal') {
      this.isOrientationLocked = false;
    }
    if (!this.isOrientationLocked && orientation === 'horizontal' && this.orientation === 'vertical') {
      var self = this;
      this.orientation = orientation;
      this.$el
        .removeClass('vertical')
        .addClass('horizontal');
      this.toggleOrientationToggle();
      this.setHeight();
    }
    if (orientation === 'vertical' && this.orientation === 'horizontal') {
      this.orientation = orientation;
      this.$el
        .removeClass('horizontal')
        .addClass('vertical');
      this.toggleOrientationToggle();
      this.setHeight();
    }
  },
  /**
   *
   */
  getOrientation: function () {
    return (this.isOrientationLocked) ? 'vertical' : this.orientation;
  },
  /**
   * Change the orientation toggle active state.
   */
  toggleOrientationToggle: function () {
    this.$el
    .find('[value="' + this.orientation + '"]')
    .removeClass('active')
    .siblings()
    .addClass('active');
  },
  /**
   *
   */
  setHeight: function () {
    if (this.orientation === 'vertical') {
      this.$el.height(document.documentElement.scrollHeight);
    }
    else {
      this.$el.height('auto');
    }
  }
});

function Tab ($tab) {
  this.$el = $tab;
  this.active = false;
  this.name = this.$el.data()['toolbarTray'] || this.$el.attr('id') ||'no name';
  this.tray;
}

/**
 * Extend the prototype of the Tray.
 */
_.extend(Tab.prototype, {
  /**
   *
   */
  toggle: function (open) {
    this.active = (open !== undefined) ? open : !this.active;
    this.$el.parent('li').toggleClass('active', this.active);
    if (this.tray) {
      this.tray.toggle(this.active);
    }
  },
  /**
   *
   */
  registerTray: function (tray) {
    this.tray = tray;
  },
});

/**
 * A toggle is an interactive element often bound to a click handler.
 *
 * @return {String}
 *   A string representing a DOM fragment.
 */
Drupal.theme.toolbarOrientationToggle = function () {
  return '<div class="toggle-orientation"><div class="lining"><button value="horizontal">Horizontal</button><button value="vertical">Vertical</button></div></div>';
};
/**
 * A toggle is an interactive element often bound to a click handler.
 *
 * @return {String}
 *   A string representing a DOM fragment.
 */
Drupal.theme.interactionMenuItemToggle = function (options) {
  return '<button aria-pressed="false" class="' + options['class'] + '">' + options.text + '</button>';
};


/**
 * Interactive menu setup methods.
 */
function decorateInteractiveMenu (event, tray) {
  if (tray.name === 'administration') {
    tray.decorate = interactiveMenuDecorator();
    tray.decorate('.interactive-menu > .menu');
  }
}

/**
 * Decorate a menu with markup and classes for attaching behaviors.
 */
var interactiveMenuDecorator = function () {

  var ui = {
    'handleOpen': Drupal.t('Open'),
    'handleClose': Drupal.t('Close')
  };

  var processLists = function (event) {
    event.stopPropagation();
    // Mark up the lists and items.
    $(event.target)
    .trigger('listChange');
  };
  var toggleList = function (event) {
    // The toggle.
    var $toggle = $(event.target);
    var $item = $toggle.closest('li');
    var $list = $item.children('ul');
    var isHidden = $list.hasClass('dormant');
    // Close open siblings.
    $item.siblings().filter('.open').find('.handle').trigger('click');
    // Toggle the item open state.
    $item
      [((isHidden) ? 'add' : 'remove') + 'Class']('open');
    // Toggle the item list visibility.
    $list
      [((isHidden) ? 'remove' : 'add') + 'Class']('dormant');
    // Twist the toggle.
    $toggle
      [((isHidden) ? 'add' : 'remove') + 'Class']('open');
    // Adjust the toggle text.
    $toggle
      .text((isHidden) ? ui.handleClose : ui.handleOpen)
      .attr('aria-pressed', isHidden);
    // Fire an event to signify that a list has been toggled.
    $item.trigger('itemtoggled', [$item.parent().data('toolbar').level, !isHidden]);
  };
  var initItems = function (event) {
    // The accordion wrapper.
    var $wrapper = $(event.target);
    var rootClass = 'root';
    var boxClass = 'box';
    var handleClass = 'handle';
    // Get lists and items.
    var $root = $wrapper.children('.' + rootClass);
    var $ul = $wrapper.find('ul');
    var $li = $wrapper.find('li');
    // Basic setup
    $ul
      .each(function (index, element) {
        $(this).data('toolbar', {
          processed: false,
          type: 'list',
          level: NaN
        });
      });
    // Initialize items and their links.
    $li
      .each(function (index, element) {
        $(this).data('toolbar', {
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
            .prepend(Drupal.theme('interactionMenuItemToggle', {
                'class': handleClass,
                'text': ui.handleOpen
              })
            );
        }
      });
  };
  /**
   * Adds a level class to each list based on its depth in the menu.
   */
  var markListLevels = function ($lists, level) {
    level = (typeof level === 'object') ? 1 : level;
    $lists
    .addClass('level-' + level)
    .each(function (index, element) {
      $(this).data().toolbar.level = level;
    });
    $lists = $lists.children('li').children('ul');
    if ($lists.length > 0) {
      markListLevels($lists, (level + 1));
    }
  };
  var setLevelVisibility = function ($lists, visibleAfter) {
    var level;
    $lists
    .each(function (index, element) {
      var $this = $(this);
      level = $(this).data().toolbar.level;
      if (level > visibleAfter) {
        $this.addClass('dormant');
      }
      else {
        $this.addClass('visible');
      }
    });
    $lists = $lists.children('li').children('ul');
    if ($lists.length > 0) {
      setLevelVisibility($lists, visibleAfter);
    }
  };
  return function (selector) {
    var context = this;
    // Find any menus that have already been decorated.
    var $wrapper = this.$el.find(selector);
    // Decorate any menus that have not been.
    $wrapper
      .once('decorate-menu')
      .addClass('clearfix')
      .each(function (index, element) {
        var $root = $(this).addClass('root');
        // Create a set of list-manipulation callbacks.
        // Called when items are added or removed.
        var listUpdate = $.Callbacks();
        listUpdate.add(_.bind(initItems, context));
        listUpdate.add(_.bind(markListLevels, context, $root));
        listUpdate.add(_.bind(setLevelVisibility, context, $root, 1));
        // Wrap the list in a div to provide a positioning context.
        $wrapper = $().add($wrapper).add(
          $root
          .wrap('<div class="interactive-menu-offset"></div>')
          .parent()
          // Bind event handlers.
          .on('setup.toolbar', _.bind(processLists, context))
          .on('listChange.toolbar', listUpdate.fire)
          .on('click.toolbar', '.handle', _.bind(toggleList, context))
          /* @todo
          .on('clean.toolbar.accordionMode', 'li', cleanItem)
          .on('activate.toolbar.accordionMode', 'li', activateItem)
          */
          .trigger('setup')
        );
      });
    return $wrapper;
  };
};
}(jQuery, _));
