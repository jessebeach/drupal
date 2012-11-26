<?php

/**
 * @file
 * Form handlers for the Edit module.
 */

/**
 * Form constructor for the field editing form.
 *
 * @see edit_field_form_validate()
 * @ingroup forms
 */
function edit_field_form(array $form, array &$form_state) {
  $entity = $form_state['entity'];
  $langcode = $form_state['langcode'];

  // Attach the actual field form.
  $options = array('field_name' =>  $form_state['field_name']);
  field_attach_form($entity->entityType(), $entity, $form, $form_state, $langcode, $options);

  $form['#validate'][] = 'edit_field_form_validate';

  $form['actions'] = array('#type' => 'actions');
  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save'),
  );

  // Simplify the form.
  _simplify_edit_field_edit_form($form);

  return $form;
}

/**
 * Simplifies the field edit form for in-place editing.
 *
 * @param array $form
 *   An associative array containing the structure of the form.
 */
function _simplify_edit_field_edit_form(array &$form) {
  $elements = element_children($form);

  // Required internal form properties.
  $internal_elements = array('actions', 'form_build_id', 'form_token', 'form_id');

  // Calculate the remaining form elements.
  $remaining_elements = array_diff($elements, $internal_elements);

  // Only simplify the form if there is a single element remaining.
  if (count($remaining_elements) === 1) {
    $element = $remaining_elements[0];

    if ($form[$element]['#type'] == 'container') {
      $language = $form[$element]['#language'];
      $children = element_children($form[$element][$language]);

      // Certain fields require different processing depending on the form
      // structure.
      if (count($children) == 0) {
        // Checkbox elements don't have a title.
        if ($form[$element][$language]['#type'] != 'checkbox') {
          $form[$element][$language]['#title_display'] = 'invisible';
        }
      }
      elseif (count($children) == 1) {
        $form[$element][$language][0]['value']['#title_display'] = 'invisible';

        // UX improvement: make the number of rows of textarea form elements
        // fit the content. (i.e. no wads of whitespace)
        if (isset($form[$element][$language][0]['value']['#type'])
            && $form[$element][$language][0]['value']['#type'] == 'textarea')
        {
          $lines = count(explode("\n", $form[$element][$language][0]['value']['#default_value']));
          $form[$element][$language][0]['value']['#rows'] = $lines + 1;
        }
      }
    }
  }

  // Make it easy for the JavaScript to identify the submit button.
  $form['actions']['submit']['#attributes'] = array('class' => array('edit-form-submit'));
}

/**
 * Validate field editing form.
 *
 * @see  edit_field_form()
 *
 * @todo: BLOCKED_ON(Drupal core, http://drupal.org/node/1846648)
 * Clean up once that issue is solved.
 */
function edit_field_form_validate(array $form, array &$form_state) {
  $entity = $form_state['entity'];
  $options = array('field_name' =>  $form_state['field_name']);

  // 'submit' in D8 is for "building the entity object", not for actual
  // submission. It appears though that if there were no validation errors, it
  // is submitted automatically.
  field_attach_submit($entity->entityType(), $entity, $form, $form_state, $options);

  // Validation.
  field_attach_form_validate($entity->entityType(), $entity, $form, $form_state, $options);
}
