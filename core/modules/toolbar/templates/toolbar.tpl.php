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
<div id="toolbar" role="navigation" class="<?php print $attributes['class']; ?>" <?php print $attributes; ?>>
  <!-- Tab bar -->
  <?php print render($toolbar['toolbar_tabs']); ?>

  <!-- Trays -->
  <?php if (!empty($toolbar['toolbar_administration'])) : ?>
    <nav class="tray administration">
      <div class="lining slider clearfix">
        <h2 class="element-invisible"><?php print t('Administration menu'); ?></h2>
        <?php print render($toolbar['toolbar_administration']); ?>
      </div>
    </nav>
  <?php endif; ?>
  <?php if (!empty($toolbar['toolbar_shortcuts'])) : ?>
    <nav class="tray shortcuts">
      <div class="lining slider clearfix">
        <h2 class="element-invisible"><?php print t('Shortcuts'); ?></h2>
        <?php print render($toolbar['toolbar_shortcuts']); ?>
      </div>
    </nav>
  <?php endif; ?>
  <?php if (!empty($toolbar['toolbar_user'])) : ?>
    <nav class="tray user">
      <div class="lining slider clearfix">
        <?php print render($toolbar['toolbar_user']); ?>
      </div>
    </nav>
  <?php endif; ?>
</div>
