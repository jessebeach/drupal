<?php
/**
 * @file
 * AJAX endpoints to retrieve & save subforms for fields and re-render fields.
 */

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\edit\Ajax\FieldFormCommand;
use Drupal\edit\Ajax\FieldFormSavedCommand;
use Drupal\edit\Ajax\FieldFormValidationErrorsCommand;
use Drupal\edit\Ajax\FieldRenderedWithoutTransformationFiltersCommand;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Page callback: Provides editing of entity fields.
 *
 * @param string $entity_type
 *   The entity type of the entity that is being edited.
 * @param int $entity_id
 *   The entity ID of the entity that is being edited.
 * @param string $field_name
 *   The name of the field that is being edited.
 * @param string $langcode
 *   The name of the language for which the field is being edited.
 * @param string $view_mode
 *   The view mode the field should be rerendered in.
 * @return array
 *   A render array.
 */
function edit_field_edit($entity_type, $entity_id, $field_name, $langcode, $view_mode) {
  $response = new AjaxResponse();

  // Ensure the entity type is valid.
  if (empty($entity_type)) {
    throw new NotFoundHttpException();
  }

  $entity_info = entity_get_info($entity_type);
  if (!$entity_info) {
    throw new NotFoundHttpException();
  }

  $entity = entity_load($entity_type, $entity_id);
  if (!$entity) {
    throw new NotFoundHttpException();
  }

  // Ensure a valid language code is set.
  $langcode = field_valid_language($langcode);

  // Ensure access to update this particular entity is granted.
  if (!edit_entity_access('update', $entity_type, $entity)) {
    throw new AccessDeniedHttpException();
  }

  // Ensure access to update this particular field is granted.
  if (!field_access('edit', $field_name, $entity_type, $entity)) {
    throw new AccessDeniedHttpException();
  }

  $field_instance = field_info_instance($entity_type, $field_name, $entity->bundle());
  if (empty($field_instance)) {
    throw new NotFoundHttpException();
  }

  $form_state = array(
    'entity' => $entity,
    'field_name' => $field_name,
    'langcode' => $langcode,
    'no_redirect' => TRUE,
    'build_info' => array('args' => array()),
  );
  form_load_include($form_state, 'inc', 'edit', 'includes/form');
  $form = drupal_build_form('edit_field_form', $form_state);

  if (!empty($form_state['executed'])) {
    // Retrieve the updated entity, save it and render only the modified field.
    $entity = $form_state['entity'];
    $entity->save();
    $output = field_view_field($entity->entityType(), $entity, $field_name, $view_mode, $langcode);

    $response->addCommand(new FieldFormSavedCommand(drupal_render($output)));
  }
  else {
    $response->addCommand(new FieldFormCommand(drupal_render($form)));

    $errors = form_get_errors();
    if (count($errors)) {
      $response->addCommand(new FieldFormValidationErrorsCommand(theme('status_messages')));
    }
  }

  // When working with a hidden form, we don't want any CSS or JS to be loaded.
  if (isset($_POST['nocssjs']) && $_POST['nocssjs'] === 'true') {
    drupal_static_reset('drupal_add_css');
    drupal_static_reset('drupal_add_js');
  }

  return $response;
}

/**
 * Page callback: render a processed text field without transformation filters.
 *
 * @param string $entity_type
 *   The entity type of the entity of which a processed text field is being
 *   rerendered.
 * @param int $entity_id
 *   The entity ID of the entity of which a processed text field is being
 *   rerendered.
 * @param string $field_name
 *   The name of the (processed text) field that that is being rerendered
 * @param string $langcode
 *   The name of the language for which the processed text field is being
 *   rererendered.
 * @param string $view_mode
 *   The view mode the processed text field should be rerendered in.
 * @return array
 *   A render array.
 */
function edit_text_field_render_without_transformation_filters($entity_type, $entity_id, $field_name, $langcode, $view_mode) {
  $response = new AjaxResponse();

  // Ensure the entity type is valid.
  if (empty($entity_type)) {
    throw new NotFoundHttpException();
  }

  $entity_info = entity_get_info($entity_type);
  if (!$entity_info) {
    throw new NotFoundHttpException();
  }

  $entity = entity_load($entity_type, $entity_id);
  if (!$entity) {
    throw new NotFoundHttpException();
  }

  // Ensure a valid language code is set.
  $langcode = field_valid_language($langcode);

  // Ensure access to update this particular entity is granted.
  if (!edit_entity_access('update', $entity_type, $entity)) {
    throw new AccessDeniedHttpException();
  }

  // Ensure access to update this particular field is granted.
  if (!field_access('edit', $field_name, $entity_type, $entity)) {
    throw new AccessDeniedHttpException();
  }

  $field_instance = field_info_instance($entity_type, $field_name, $entity->bundle());
  if (empty($field_instance)) {
    throw new NotFoundHttpException();
  }

  // Render the field in our custom display mode; retrieve the re-rendered
  // markup, this is what we're after.
  $field_output = field_view_field($entity_type, $entity, $field_name, 'edit-render-without-transformation-filters');
  $output = $field_output[0]['#markup'];
  $response->addCommand(new FieldRenderedWithoutTransformationFiltersCommand($output));

  return $response;
}
