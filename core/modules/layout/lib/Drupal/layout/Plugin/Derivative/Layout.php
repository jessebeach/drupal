<?php

/**
 * @file
 * Definition of Drupal\layout\Plugin\Derivative\Layout.
 */

namespace Drupal\layout\Plugin\Derivative;

use DirectoryIterator;
use Drupal\Component\Plugin\Derivative\DerivativeInterface;
use Drupal\Core\Config\FileStorage;

/**
 * Layout plugin derivative definition.
 */
class Layout implements DerivativeInterface {

  /**
   * List of derivatives.
   *
   * Associative array keyed by 'provider__layoutname' where provider is the
   * module or theme name and layoutname is the .yml filename, such as
   * 'bartik__page' or 'layout__one-col'. The values of the array are
   * associative arrays themselves with metadata about the layout such as
   * 'template', 'css', 'admin css' and so on.
   *
   * @var array
   */
  protected $derivatives = array();

  /**
   * Layout derivative type.
   *
   * Defines the subdirectory under ./layout where layout metadata is loooked
   * for. Overriding implementations should change this to look for other
   * types in a different subdirectory.
   *
   * @var string
   */
  protected $type = 'static';

  /**
   * Implements DerivativeInterface::getDerivativeDefinition().
   */
  public function getDerivativeDefinition($derivative_id, array $base_plugin_definition) {
    if (!empty($this->derivatives) && !empty($this->derivatives[$derivative_id])) {
      return $this->derivatives[$derivative_id];
    }
    $this->getDerivativeDefinitions($base_plugin_definition);
    return $this->derivatives[$derivative_id];
  }

  /**
   * Implements DerivativeInterface::getDerivativeDefinitions().
   */
  public function getDerivativeDefinitions(array $base_plugin_definition) {
    $available_layout_providers = array();

    // Add all modules as possible layout providers.
    foreach (module_list() as $module) {
      $available_layout_providers[$module] = array(
        'type' => 'module',
        'provider' => $module,
        'dir' => drupal_get_path('module', $module),
      );
    }

    // Add all themes as possible layout providers.
    foreach (list_themes() as $theme_id => $theme) {
      $available_layout_providers[$theme_id] = array(
        'type' => 'theme',
        'provider' => $theme->name,
        'dir' => drupal_get_path('theme', $theme->name),
      );
    }

    foreach ($available_layout_providers as $provider) {
      // Looks for layouts in the 'layout' directory under the module/theme.
      // There could be subdirectories under there with one layout defined
      // in each.
      $dir = $provider['dir'] . DIRECTORY_SEPARATOR . 'layouts' . DIRECTORY_SEPARATOR . $this->type;
      if (file_exists($dir)) {
        $this->iterateDirectories($dir, $provider);
      }
    }
    return $this->derivatives;
  }

  /**
   * Finds layout definitions by looking for layout metadata.
   */
  protected function iterateDirectories($dir, $provider) {
    $directories = new DirectoryIterator($dir);
    foreach ($directories as $fileinfo) {
      if ($fileinfo->isDir() && !$fileinfo->isDot()) {
        // Keep discovering in subdirectories to arbitrary depth.
        $this->iterateDirectories($fileinfo->getPathname(), $provider);
      }
      elseif ($fileinfo->isFile() && pathinfo($fileinfo->getFilename(), PATHINFO_EXTENSION) == 'yml') {
        // Declarative layout definitions are defined with a .yml file in a
        // layout subdirectory. This provides all information about the layout
        // such as layout markup template and CSS and JavaScript files to use.
        $directory = new FileStorage($fileinfo->getPath());
        $key = $provider['provider'] . '__' .  $fileinfo->getBasename('.yml');
        $this->derivatives[$key] = $directory->read($fileinfo->getBasename('.yml'));
        $this->derivatives[$key]['theme'] = $key;
        $this->derivatives[$key]['path'] = $fileinfo->getPath();
        $this->derivatives[$key]['provider'] = $provider;
        // If the layout author didn't specify a template name, assume the same
        // name as the yml file.
        if (!isset($this->derivatives[$key]['template'])) {
          $this->derivatives[$key]['template'] = $fileinfo->getBasename('.yml');
        }
      }
    }
  }
}
