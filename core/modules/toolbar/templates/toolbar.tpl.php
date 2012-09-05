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
 * - $toolbar['toolbar_menu']: Top level management menu links.
 * - $toolbar['toolbar_drawer']: A place for extended toolbar content.
 *
 * @see template_preprocess()
 * @see template_preprocess_toolbar()
 *
 * @ingroup themeable
 */
?>
<nav id="toolbar" role="navigation" class="<?php print $attributes['class']; ?> clearfix" <?php print $attributes; ?>>
  <div class="toolbar-bar clearfix">
    <?php print render($toolbar['toolbar_actions']); ?>
    <?php print render($toolbar['toolbar_user']); ?>
  </div>

  <div class="toolbar-tray" name="toolbar-tray">
    <div class="lining">
      <?php print render($toolbar['toolbar_filter']); ?>
      <?php print render($toolbar['toolbar_shortcuts']); ?>
      <nav class="toolbar-menu">
        <h2 class="element-invisible"><?php print t('Administration menu'); ?></h2>
        <?php print render($toolbar['toolbar_menu']); ?>
      </nav>
    </div>
  </div>
</nav>
