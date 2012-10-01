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
<div id="toolbar" role="navigation" class="<?php print $attributes['class']; ?> clearfix" <?php print $attributes; ?>>
  <div class="toolbar-bar clearfix">
    <div class="section first">
      <?php print render($toolbar['toolbar_navigation']); ?>
    </div>
    <div class="section second"></div>
    <?php if (!empty($toolbar['toolbar_user'])) : ?>
      <div class="section third">
        <?php print render($toolbar['toolbar_user']); ?>
      </div>
    <?php endif; ?>
  </div>

  <div class="toolbar-tray">
    <div class="lining slider">
      <?php if (!empty($toolbar['toolbar_shortcuts'])) : ?>
        <div class="toolbar-shortcuts clearfix">
          <h2 class="element-invisible"><?php print t('Shortcuts'); ?></h2>
          <?php print render($toolbar['toolbar_shortcuts']); ?>
        </div>
      <?php endif; ?>
      <?php if (!empty($toolbar['toolbar_menu'])) : ?>
        <nav class="toolbar-menu clearfix">
          <h2 class="element-invisible"><?php print t('Administration menu'); ?></h2>
          <?php print render($toolbar['toolbar_menu']); ?>
        </nav>
      <?php endif; ?>
    </div>
  </div>
</div>
