<?php

/**
 * @file
 * Default template for admin toolbar.
 *
 * Available variables:
 * - $attributes: An instance of Attributes class that can be manipulated as an
 *    array and printed as a string.
 *    It includes the 'class' information, which includes:
 *   - toolbar: The current template type, i.e., "theming hook".
 * - $toolbar['toolbar_user']: User account / logout links.
 * - $toolbar['toolbar_menu']: Top level Administration menu links.
 * - $toolbar['toolbar_drawer']: A place for extended toolbar content.
 *
 * @see template_preprocess()
 * @see template_preprocess_toolbar()
 *
 * @ingroup themeable
 */
?>
<nav id="toolbar" role="navigation" class="<?php print $attributes['class']; ?> clearfix" <?php print $attributes; ?>>
  <div class="toolbar-bar">
    <div class="toolbar-menu clearfix">
      <?php print render($toolbar['toolbar_home']); ?>
      <?php print render($toolbar['toolbar_user']); ?>
      <?php print render($toolbar['toolbar_tray_toggle']); ?>
      <?php if ($toolbar['toolbar_drawer']):?>
        <?php print render($toolbar['toolbar_toggle']); ?>
      <?php endif; ?>
    </div>
    <?php print render($toolbar['toolbar_drawer']); ?>
  </div>

  <div class="toolbar-tray">
    <div class="filter-search clearfix">
      <?php print render($toolbar['toolbar_filter']); ?>
      <span class="close"><?php print t('x'); ?></span>
    </div>
    <div class="tray-menu clearfix">
      <?php print render($toolbar['toolbar_menu']); ?>
    </div>
  </div>
</nav>
