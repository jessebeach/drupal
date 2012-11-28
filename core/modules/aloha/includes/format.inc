<?php

/**
 * @file
 * Aloha Editor Repository API page callbacks.
 */

/**
 * Provides the test cases used by _aloha_calculate_allowed_html().
 */
function _aloha_allowed_html_tests() {
  return array(
    array(
      'tag' => 'p',
      // For a single <p> that would be stripped, filter_autop would generate
      // it again, making it impossible to detect that filter_html actually
      // stripped it away. Hence we need to use two adjacent <p> tags.
      'testcase' => '<p>Hello, world!</p><p>This is Drupal!</p>',
      'attributes' => array(
        'prefix' => '<p ',
        'suffix' => '>Hello, world!</p>',
        'names' => array('dir'),
      ),
    ),
    array(
      'tag' => 'blockquote',
      'testcase' => '<blockquote>Veni, vidi, vici.</blockquote>',
      'attributes' => array(
        'prefix' => '<blockquote ',
        'suffix' => '>Veni, vidi, vici!</blockquote>',
        'names' => array('cite'),
      ),
    ),
    array('tag' => 'h1', 'testcase' => '<h1>heading 1</h1>'),
    array('tag' => 'h2', 'testcase' => '<h2>heading 2</h2>'),
    array('tag' => 'h3', 'testcase' => '<h3>heading 3</h3>'),
    array('tag' => 'h4', 'testcase' => '<h4>heading 4</h4>'),
    array('tag' => 'h5', 'testcase' => '<h5>heading 5</h5>'),
    array('tag' => 'h6', 'testcase' => '<h6>heading 6</h6>'),
    array('tag' => 'ul', 'testcase' => '<ul><li>A</li><li>B</li></ul>'),
    array('tag' => 'ol', 'testcase' => '<ol><li>A</li><li>B</li></ol>'),
    array('tag' => 'li', 'testcase' => '<li>A</li>'),
    array('tag' => 'pre', 'testcase' => '<pre>preformatted text</pre>'),
    // Text-level elements. (Should all be wrapped in <p> tags.)
    array(
      'tag' => 'a',
      'testcase' => '<p><a>hyperlink</a></p>',
      'attributes' => array(
        'prefix' => '<p><a ',
        'suffix' => '>hyperlink</a></p>',
        'names' => array('href', 'target', 'rel', 'media'),
      ),
    ),
    array('tag' => 'em', 'testcase' => '<p><em>emphasized</em></p>'),
    array('tag' => 'strong', 'testcase' => '<p><strong>strong</strong></p>'),
    array('tag' => 'i', 'testcase' => '<p><i>italicized</i></p>'),
    array('tag' => 'b', 'testcase' => '<p><b>bold</b></p>'),
    array('tag' => 'u', 'testcase' => '<p><u>underlined</u></p>'),
    array('tag' => 'cite', 'testcase' => '<p><cite>He</cite> said "WOW, Drupal rocks!"</p>'),
    array('tag' => 'q', 'testcase' => '<p>He said <q>"WOW, Drupal rocks!"</q></p>'),
    array('tag' => 'br', 'testcase' => '<p>First line<br />Second line</p>'),
    array(
      'tag' => 'code',
      'testcase' => '<p><code>Hello, world!</code></p>',
      'attributes' => array(
        'prefix' => '<p><code ',
        'suffix' => '>Hello, world!</code></p>',
        'names' => array('lang'),
      ),
    ),
    array(
      'tag' => 'img',
      'testcase' => '<p><img /></p>',
      'attributes' => array(
        'prefix' => '<p><img ',
        'suffix' => ' /></p>',
        'names' => array('src', 'alt', 'title')
      ),
    ),
  );
}

/**
 * Calculates the allowed HTML tags.
 *
 * @param  string $format_id
 *   A text format ID.
 * @return
 *   @see aloha_get_allowed_html_by_format()
 *
 * @todo  Refactor.
 * @todo  Unit tests. Start from http://drupal.org/node/1782838#comment-6562024.
 */
function _aloha_calculate_allowed_html($format_id) {
  // For testing whether any attribute is allowed.
  $any = 'thisIsAnExtremelyUnlikelyToExistAttributeName';

  // For testing whether data- attributes are allowed.
  $data = 'data-' . chr(mt_rand(65, 90));

  // Helper function to assert the filtered text still contains the original.
  $assert_match = function ($original, $format_id) {
    $filtered = check_markup($original, $format_id);
    $result = preg_replace("/>\s+</", "><", $filtered);
    return stripos($result, $original) !== FALSE;
  };

  // Run all the above tagtests to determine which tags and attributes are
  // allowed in the given text format.
  $allowed_html = array_reduce(
    _aloha_allowed_html_tests(),
    function($result, $tagtest) use ($assert_match, $format_id, $any, $data) {
      $tag = $tagtest['tag'];
      if ($assert_match($tagtest['testcase'], $format_id)) {
        $result[$tag] = array();

        // Break early if there are no attributes to test.
        if (!isset($tagtest['attributes'])) {
          return $result;
        }

        // Anonymous function to generate attribute test cases.
        $generate_attr_testcase = function($attr) use ($tagtest) {
          $case = '';
          $case .= $tagtest['attributes']['prefix'];
          $case .= $attr . '="' . $attr . ' attribute test"';
          $case .= $tagtest['attributes']['suffix'];
          return $case;
        };

        // The tag test passed, then we can also do the attribute tests. First,
        // check if any attribute is allowed, if that's not the case, then
        // figure out which specific attributes are allowed.
        if ($assert_match($generate_attr_testcase($any), $format_id)) {
          $result[$tag][] = '*';
        }
        else {
          $attrs = array_merge(array($data), $tagtest['attributes']['names']);
          foreach ($attrs as $attr) {
            if ($assert_match($generate_attr_testcase($attr), $format_id)) {
              $result[$tag][] = ($attr === $data) ? 'data-' : $attr;
            }
          }
        }
      }

      return $result;
    },
    array()
  );

  return $allowed_html;
}
