<?php

/**
 * @file
 * Contains Drupal\edit\EditBundle.
 */

namespace Drupal\edit;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\Bundle\Bundle;

/**
 * Edit dependency injection container.
 */
class EditBundle extends Bundle {

  /**
   * Overrides Symfony\Component\HttpKernel\Bundle\Bundle::build().
   */
  public function build(ContainerBuilder $container) {
    // Register the plugin managers for our plugin types with the dependency injection container.
    $container->register('plugin.manager.edit.processed_text_editor', 'Drupal\edit\Plugin\Type\ProcessedTextEditorManager');
  }

}
