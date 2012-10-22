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
    vertical: new VerticalTray($tray),
    horizontal: new HorizontalTray($tray)
  };
  // Bind the methods of the trays.
  _.bindAll(this.trays.vertical);
  _.bindAll(this.trays.horizontal);
  this.$tray = this.getTray();
  this.$trigger = $toolbar.find('.toggle-tray');
  this.mediaQueries = [];
  this.orientation = 'vertical';
  this.state = 'closed';
  this.ui = {
    'activeClass': 'active',
    'trayOpenBodyClass': 'menu-tray-open'
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
  getTray: function () {
    return this.trays[this.orientation];
  },
  /**
   *
   */
  mediaQueryChangeHandler: function (mql, event) {
    if (mql.matches && this.orientation === 'vertical') {
      this.orientation = 'horizontal';
    }
    else if (!mql.matches && this.orientation == 'horizontal') {
      this.orientation = 'vertical';
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
    this.getTray().$el[((this.state === 'open') ? 'add' : 'remove') + 'Class'](this.ui.activeClass);
    // Add a class to the body so it can be styled to react to the tray.
    $('body')[((this.state === 'open') ? 'add' : 'remove') + 'Class'](this.ui.trayOpenBodyClass);
  },
  /**
   *
   */
  displace: function (event) {
    this.getTray().$el.css({
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
 * Renders the display of a tray as a vertical, sliding container.
 */
function VerticalTray ($el) {
  this.$el = $el;
};
/**
 * Extend the prototype of the VerticalTray.
 */
_.extend(VerticalTray.prototype, {
  /**
   *
   */
  render: function () {
    // The tray has a couple setup methods to run.
    this.$el
      // Register event handlers.
      .on({
        'setup.toolbar': this.renderAccordion,
      })
      // The tray will be positioned at the edge of the window.
      .addClass('vertical')
      // Triger setup.
      .trigger('setup');
  },
  /**
   * Accordion behavior.
   */
  renderAccordion: function (event) {
    event.stopPropagation();
    var context = this;
    this.$el.find('.menu-site > .menu').each(function (index, element) {
      var $root = $(this).addClass('root');
        // Wrap the list in a div to provide a positioning context.
      var $wrapper = $root
        .wrap(
          $('<div>')
            .css({
              height: '100%',
              position: 'relative'
            })
            .addClass('fleximenu')
        )
        .parent()
        // Bind event handlers.
        .on({
          'setup.toolbar': context.accordionSetup
        });
      // Create a set of list-manipulation callbacks.
      // Called when items are added or removed.
      var listUpdate = $.Callbacks();
      // Set visibility
      listUpdate.add(context.initItems);
      listUpdate.add(_.bind(context.markListLevels, null, $root));
      listUpdate.add(_.bind(context.setLevelVisibility, null, $root, 1));
      $wrapper
        .on('listChange.toolbar', listUpdate.fire)
        .on('clean.toolbar.accordionMode', 'li', context.cleanItem)
        .on('activate.toolbar.accordionMode', 'li', context.activateItem)
        .on('click.toolbar.accordionMode', '.handle', context.accordionToggle)
        .trigger('setup');
    });
  },
  accordionSetup: function (event) {
    event.stopPropagation();
    // Mark up the lists and items.
    $(event.target)
    .trigger('listChange');

  },
  cleanItem: function (event) {
    /* @todo */
  },
  activateItem: function (event) {
    /* @todo */
  },
  accordionToggle: function (event) {
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
      ['slide' + ((isHidden) ? 'Down' : 'Up')]()
      [((isHidden) ? 'remove' : 'add') + 'Class']('dormant');
    // Twist the toggle.
    $toggle
      [((isHidden) ? 'add' : 'remove') + 'Class']('open');
  },
  initItems: function (event) {
    // The accordion wrapper.
    var $wrapper = $(event.target);
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
  },
  /**
   * Adds a level class to each list based on its depth in the menu.
   */
  markListLevels: function ($lists, level) {
    level = (typeof level === 'object') ? 1 : level;
    $lists
    .addClass('level-' + level)
    .each(function (index, element) {
      $(this).data().toolbar.level = level;
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
      this.setLevelVisibility($lists, visibleAfter);
    }
  }
});
/**
 * Renders the display of a tray as a horizontal container.
 */
function HorizontalTray ($el) {
  this.$el = $el;
}
/**
 * Extend the prototype of the HorizontalTray.
 */
$.extend(HorizontalTray.prototype, {
  /**
   *
   */
  render: function (mql, event) {
    console.log('render horizontally');
  }
});
}(jQuery, _));
