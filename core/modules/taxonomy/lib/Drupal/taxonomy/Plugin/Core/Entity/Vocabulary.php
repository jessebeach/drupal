<?php

/**
 * @file
 * Definition of Drupal\taxonomy\Plugin\Core\Entity\Vocabulary.
 */

namespace Drupal\taxonomy\Plugin\Core\Entity;

use Drupal\Core\Entity\Entity;
use Drupal\Core\Annotation\Plugin;
use Drupal\Core\Annotation\Translation;

/**
 * Defines the taxonomy vocabulary entity.
 *
 * @Plugin(
 *   id = "taxonomy_vocabulary",
 *   label = @Translation("Taxonomy vocabulary"),
 *   module = "taxonomy",
 *   controller_class = "Drupal\taxonomy\VocabularyStorageController",
 *   form_controller_class = {
 *     "default" = "Drupal\taxonomy\VocabularyFormController"
 *   },
 *   base_table = "taxonomy_vocabulary",
 *   entity_keys = {
 *     "id" = "vid",
 *     "label" = "name"
 *   },
 *   view_modes = {
 *     "full" = {
 *       "label" = "Taxonomy vocabulary",
 *       "custom_settings" = FALSE
 *     }
 *   }
 * )
 */
class Vocabulary extends Entity {

  /**
   * The taxonomy vocabulary ID.
   *
   * @var integer
   */
  public $vid;

  /**
   * Name of the vocabulary.
   *
   * @var string
   */
  public $name;

  /**
   * The vocabulary machine name.
   *
   * @var string
   */
  public $machine_name;

  /**
   * Description of the vocabulary.
   *
   * @var string
   */
  public $description;

  /**
   * The type of hierarchy allowed within the vocabulary.
   *
   * Possible values:
   * - TAXONOMY_HIERARCHY_DISABLED: No parents.
   * - TAXONOMY_HIERARCHY_SINGLE: Single parent.
   * - TAXONOMY_HIERARCHY_MULTIPLE: Multiple parents.
   *
   * @var integer
   */
  public $hierarchy = TAXONOMY_HIERARCHY_DISABLED;

  /**
   * The weight of this vocabulary in relation to other vocabularies.
   *
   * @var integer
   */
  public $weight = 0;

  /**
   * Implements Drupal\Core\Entity\EntityInterface::id().
   */
  public function id() {
    return $this->vid;
  }
}
