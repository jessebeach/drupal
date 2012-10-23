/**
 * @file toolbar.js
 *
 * Defines the behavior of the Drupal administration toolbar.
 */
(function ($, _) {

"use strict";

/**
 * Attach toggling behavior and notify the overlay of the toolbar.
 */
Drupal.behaviors.toolbar = {
  attach: function(context, settings) {
    var options = _.extend(this.options, settings);
    var $toolbar = $(context).find('.toolbar-main').once('toolbar');
    if ($toolbar.length) {
      var toolbar = new ToolBar($toolbar, VerticalTray, HorizontalTray);
      // Set up switching between the vertical and horizontal presentation
      // of the toolbar.
      if (options.toolbar.breakpoints && options.toolbar.breakpoints['module.toolbar.wide'] !== undefined) {
        var mql = matchMedia(settings.toolbar.breakpoints['module.toolbar.wide']);
        mql.addListener(toolbar.mediaQueryChangeHandler);
        toolbar.mediaQueries.push(mql);
        if (mql.matches) {
          toolbar.orientation = 'horizontal';
        }
      }
      // Render the Toolbar tray.
      toolbar.renderTray();
    }
  },
  options: {
    toolbar: {
      breakpoints: null
    }
  }
};
/**
 * A toolbar is an administration action button container.
 */
function ToolBar ($toolbar, VerticalTray, HorizontalTray) {
  this.$toolbar = $toolbar;
  this.$bar = $toolbar.find('.bar');
  var $tray = $toolbar.find('.tray');
  this.trays = {
    vertical: new VerticalTray($tray, '.menu-site > .menu'),
    horizontal: new HorizontalTray($tray, '.menu-site > .menu')
  };
  // Bind the methods of the trays.
  _.bindAll(this.trays.vertical);
  _.bindAll(this.trays.horizontal);
  this.$tray = this.getTray();
  this.$shortcuts = $toolbar.find('.shortcuts');
  this.$trigger = $toolbar.find('.toggle-tray');
  this.mediaQueries = [];
  this.orientation = 'vertical';
  this.state = 'closed';
  this.ui = {
    'activeClass': 'active',
    'expandClass': 'expand',
    'shortcutsClass': 'hidden',
    'trayOpenBodyClass': 'toolbar-tray-open',
    'trayOpenBodyClassVertical': 'toolbar-vertical',
    'trayOpenBodyClassHorizontal': 'toolbar-horizontal'
  };
  // Show icons if JavaScript is enabled.
  this.$toolbar.addClass('icons');
  // Bind all ToolBar methods to the instance.
  _.bindAll(this);
  // Recalculate the offset top on screen resize.
  // Use throttle to prevent setHeight from being called too frequently.
  var setHeight = _.debounce(this.setHeight, 250);
  $(window)
    .on({
      'resize.toolbar': setHeight
    });
  // Register for offsettopchange events.
  $(document)
    .on({
      // Offset value vas changed by a third party script.
      'offsettopchange.toolbar': this.displace
    });
  // Toolbar event handlers.
  this.$toolbar
    .on({
      'setup.toolbar': setHeight,
    })
    .trigger('setup');
  // Tray trigger.
  this.$trigger
    .on({
      'setup.toolbar': this.toggleTrigger,
      'click.toolbar': this.handleTriggerClick,
    })
    .trigger('setup');
};
/**
 * Extend the prototype of the VerticalTray class.
 */
$.extend(ToolBar.prototype, {
  /**
   * The height of the toolbar offsets the top of the page content.
   *
   * Page components can register with the offsettopchange event to know when
   * the height of the toolbar changes.
   */
  setHeight: function () {
    this.height = this.$bar.outerHeight();
    this.$bar.attr('data-offset-top', this.height);
    // Alter the padding on the top of the body element.
    // @todo, this should be moved to drupal.js and register for
    // the offsettopchange event.
    $('body').css('paddingTop', this.height);
    $(document).trigger('offsettopchange');
  },
  /**
   *
   */
  renderTray: function () {
    this.trays[this.orientation].render();
  },
  /**
   *
   */
  destroyTray: function () {
    this.trays[this.orientation].destroy();
  },
  /**
   *
   */
  getTray: function () {
    return this.trays[this.orientation];
  },
  /**
   *
   */
  mediaQueryChangeHandler: function (mql, event) {
    if (mql.matches && this.orientation === 'vertical') {
      // Destroy the current tray.
      this.destroyTray();
      this.orientation = 'horizontal';
      $('body').addClass(this.ui.trayOpenBodyClassHorizontal).removeClass(this.ui.trayOpenBodyClassVertical);
    }
    else if (!mql.matches && this.orientation == 'horizontal') {
      // Destroy the current tray.
      this.destroyTray();
      this.orientation = 'vertical';
      $('body').addClass(this.ui.trayOpenBodyClassVertical).removeClass(this.ui.trayOpenBodyClassHorizontal);
    }
    // Render the tray
    this.renderTray();
  },
  /**
   *
   */
  handleTriggerClick: function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.state = (this.state === 'closed') ? 'open' : 'closed';
    this.toggleTray();
    this.toggleTrigger();
  },
  /**
   *
   */
  toggleTrigger: function (event) {
    this.$trigger[((this.state === 'open') ? 'add' : 'remove') + 'Class'](this.ui.activeClass);
  },
  /**
   *
   */
  toggleTray: function (event) {
    this.getTray().$tray[((this.state === 'open') ? 'add' : 'remove') + 'Class'](this.ui.activeClass);
    this.$shortcuts[((this.state === 'open') ? 'add' : 'remove') + 'Class'](this.ui.shortcutsClass);
    if (this.state !== 'open') {
      this.getTray().$tray.removeClass(this.ui.expandClass);
    }
    // Add a class to the body so it can be styled to react to the tray.
    $('body')[((this.state === 'open') ? 'add' : 'remove') + 'Class'](this.ui.trayOpenBodyClass);
    $('body')[((this.state === 'open') ? 'add' : 'remove') + 'Class'](this.ui.trayOpenBodyClass);
  },
  /**
   *
   */
  displace: function (event) {
    this.getTray().$tray
      .add(this.$shortcuts)
      .css({
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
  }
});
/**
 * Common interactive menu setup methods.
 */
var interactiveMenu =  function () {

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
      ['slide' + ((isHidden) ? 'Down' : 'Up')](50)
      [((isHidden) ? 'remove' : 'add') + 'Class']('dormant');
    // Twist the toggle.
    $toggle
      [((isHidden) ? 'add' : 'remove') + 'Class']('open');
    // Fire an event to signify that a list has been toggled.
    $item.trigger('itemToggled', [$item.parent().data('toolbar').level, !isHidden]);
  };
  var initItems = function (event) {
    // The accordion wrapper.
    var $wrapper = $(event.target);
    var rootClass = 'root';
    var boxClass = 'box';
    var handleClass = 'handle';
    // Get lists and items.
    var $root = $wrapper.children('.' + rootClass);
    var $ul = $wrapper.find('ul').once('interactive-menu');
    var $li = $wrapper.find('li').once('interactive-menu');
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
            .prepend(
              $('<span>', {
                'class': handleClass,
                text: ''
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

  return {
    /**
     * Decorate a menu with markup and classes for attaching behaviors.
     */
    decorate: function (menuPath) {
      var context = this;
      // Find any menus that have already been decorated.
      var $wrapper = this.$tray.find('.interactive-menu');
      // Decorate any menus that have not been.
      this.$tray.find(menuPath)
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
            .wrap('<div class="interactive-menu"></div>')
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
    }
  };
};
/**
 * Renders the display of a tray as a vertical, sliding container.
 */
function VerticalTray ($el, menuPath) {
  this.$tray = $el;
  this.tag = 'vertical';
  this.$menu = $();
  this.menuPath = menuPath;
}
/**
 * Extend the prototype of the VerticalTray.
 */
_.extend(VerticalTray.prototype, interactiveMenu(), {
  /**
   *
   */
  render: function () {
    this.$menu = this.decorate(this.menuPath);
    this.$tray.addClass(this.tag);
  },
  destroy: function () {
    this.$tray.removeClass(this.tag);
  }
});
/**
 * Renders the display of a tray as a horizontal container.
 */
function HorizontalTray ($el, menuPath) {
  this.$tray = $el;
  this.tag = 'horizontal';
  this.$menu = $();
  this.menuPath = menuPath;
}
/**
 * Extend the prototype of the HorizontalTray.
 */
$.extend(HorizontalTray.prototype, interactiveMenu(), {
  /**
   *
   */
  render: function () {
    this.$menu = this.decorate(this.menuPath);
    this.$tray.addClass(this.tag);
    // Bind to menu events.
    this.$tray
    .find('.interactive-menu')
    .once('horizontal-tray')
    .on({
      'itemToggled': this.revealSubitems
    }, 'li');
  },
  destroy: function () {
    this.$tray.removeClass(this.tag);
  },
  revealSubitems: function (event, level, isHidden) {
    event.stopPropagation();
    if (level === 1) {
      this.$tray[((!isHidden) ? 'add' : 'remove') + 'Class']('expand');
    }
  }
});
}(jQuery, _));
