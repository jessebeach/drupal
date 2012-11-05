/**
 * Decorate a menu with markup and classes for attaching behaviors.
 */

(function ($) {

$.fn.interactiveMenu = function () {

  var ui = {
    'handleOpen': Drupal.t('Open'),
    'handleClose': Drupal.t('Close')
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
  };
  /**
   *
   */
  var initItems = function ($list) {
    var boxClass = 'box';
    var handleClass = 'handle';
    // Get lists and items.
    var $ul = $list.find('ul').andSelf();
    var $li = $list.find('li');
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
    level = (!level) ? 1 : level;
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
  return this.each(function (selector) {
    var $menu = $(this).once('decorate-menu');
    if ($menu.length) {
      $menu.addClass('root');
      initItems($menu);
      markListLevels($menu);
      setLevelVisibility($menu, 1);
      // Wrap the list in a div to provide a positioning context.
      $menu
      .wrap('<div class="interactive-menu-offset"></div>')
      .parent()
      // Bind event handlers.
      .on('click.interactivemenu', '.handle', toggleList);
    }
  });
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
}(jQuery));
