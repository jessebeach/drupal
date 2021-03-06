<?php

/**
 * @file
 * Definition of Drupal\Core\Entity\Field\Type\EntityWrapper.
 */

namespace Drupal\Core\Entity\Field\Type;

use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\TypedData\Type\TypedData;
use Drupal\Core\TypedData\ComplexDataInterface;
use Drupal\Core\TypedData\ContextAwareInterface;
use Drupal\Core\TypedData\TypedDataInterface;
use ArrayIterator;
use IteratorAggregate;
use InvalidArgumentException;

/**
 * Defines an 'entity' data type, e.g. the computed 'entity' property of entity references.
 *
 * This object wraps the regular entity object and implements the
 * ComplexDataInterface by forwarding most of its methods to the wrapped entity
 * (if set).
 *
 * The plain value of this wrapper is the entity object, i.e. an instance of
 * Drupal\Core\Entity\EntityInterface. For setting the value the entity object
 * or the entity ID may be passed, whereas passing the ID is only supported if
 * an 'entity type' constraint is specified.
 *
 * Supported constraints (below the definition's 'constraints' key) are:
 *  - entity type: The entity type.
 *  - bundle: The bundle or an array of possible bundles.
 *
 * Supported settings (below the definition's 'settings' key) are:
 *  - id source: If used as computed property, the ID property used to load
 *    the entity object.
 */
class EntityWrapper extends TypedData implements IteratorAggregate, ComplexDataInterface, ContextAwareInterface {

  /**
   * The name.
   *
   * @var string
   */
  protected $name;

  /**
   * The parent data structure.
   *
   * @var mixed
   */
  protected $parent;

  /**
   * The referenced entity type.
   *
   * @var string
   */
  protected $entityType;

  /**
   * The entity ID if no 'id source' is used.
   *
   * @var string
   */
  protected $id;

  /**
   * Implements TypedDataInterface::__construct().
   */
  public function __construct(array $definition) {
    $this->definition = $definition + array('constraints' => array());
    $this->entityType = isset($this->definition['constraints']['entity type']) ? $this->definition['constraints']['entity type'] : NULL;
  }

  /**
   * Implements TypedDataInterface::getValue().
   */
  public function getValue() {
    $source = $this->getIdSource();
    $id = $source ? $source->getValue() : $this->id;
    return $id ? entity_load($this->entityType, $id) : NULL;
  }

  /**
   * Helper to get the typed data object holding the source entity ID.
   *
   * @return \Drupal\Core\TypedData\TypedDataInterface|FALSE
   */
  protected function getIdSource() {
    return !empty($this->definition['settings']['id source']) ? $this->parent->get($this->definition['settings']['id source']) : FALSE;
  }

  /**
   * Implements TypedDataInterface::setValue().
   *
   * Both the entity ID and the entity object may be passed as value.
   */
  public function setValue($value) {
    // Support passing in the entity object.
    if ($value instanceof EntityInterface) {
      $this->entityType = $value->entityType();
      $value = $value->id();
    }
    elseif (isset($value) && !(is_scalar($value) && !empty($this->definition['constraints']['entity type']))) {
      throw new InvalidArgumentException('Value is no valid entity.');
    }

    $source = $this->getIdSource();
    if ($source) {
      $source->setValue($value);
    }
    else {
      $this->id = $value;
    }
  }

  /**
   * Implements TypedDataInterface::getString().
   */
  public function getString() {
    $entity = $this->getValue();
    return $entity ? $entity->label() : '';
  }

  /**
   * Implements TypedDataInterface::validate().
   */
  public function validate($value = NULL) {
    // TODO: Implement validate() method.
  }

  /**
   * Implements IteratorAggregate::getIterator().
   */
  public function getIterator() {
    $entity = $this->getValue();
    return $entity ? $entity->getIterator() : new ArrayIterator(array());
  }

  /**
   * Implements ComplexDataInterface::get().
   */
  public function get($property_name) {
    $entity = $this->getValue();
    // @todo: Allow navigating through the tree without data as well.
    return $entity ? $entity->get($property_name) : NULL;
  }

  /**
   * Implements ComplexDataInterface::set().
   */
  public function set($property_name, $value) {
    $this->get($property_name)->setValue($value);
  }

  /**
   * Implements ContextAwareInterface::getName().
   */
  public function getName() {
    return $this->name;
  }

  /**
   * Implements ContextAwareInterface::setName().
   */
  public function setName($name) {
    $this->name = $name;
  }

  /**
   * Implements ContextAwareInterface::getParent().
   */
  public function getParent() {
    return $this->parent;
  }

  /**
   * Implements ContextAwareInterface::setParent().
   */
  public function setParent($parent) {
    $this->parent = $parent;
  }

  /**
   * Implements ComplexDataInterface::getProperties().
   */
  public function getProperties($include_computed = FALSE) {
    $entity = $this->getValue();
    return $entity ? $entity->getProperties($include_computed) : array();
  }

  /**
   * Implements ComplexDataInterface::getPropertyDefinition().
   */
  public function getPropertyDefinition($name) {
    $definitions = $this->getPropertyDefinitions();
    return isset($definitions[$name]) ? $definitions[$name] : FALSE;
  }

  /**
   * Implements ComplexDataInterface::getPropertyDefinitions().
   */
  public function getPropertyDefinitions() {
    // @todo: Support getting definitions if multiple bundles are specified.
    return entity_get_controller($this->entityType)->getFieldDefinitions($this->definition['constraints']);
  }

  /**
   * Implements ComplexDataInterface::getPropertyValues().
   */
  public function getPropertyValues() {
    $entity = $this->getValue();
    return $entity ? $entity->getPropertyValues() : array();
  }

  /**
   * Implements ComplexDataInterface::setPropertyValues().
   */
  public function setPropertyValues($values) {
    if ($entity = $this->getValue()) {
      $entity->setPropertyValues($values);
    }
  }

  /**
   * Implements ComplexDataInterface::isEmpty().
   */
  public function isEmpty() {
    return (bool) $this->getValue();
  }
}
