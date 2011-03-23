<?php

/**
 * @file
 *   Allows displaying dates in FBSS's custom themed format.
 */

/**
 * A handler for the "Created time" field.
 */
class facebook_status_views_handler_field_created extends views_handler_field_date {
  function option_definition() {
    $options = parent::option_definition();
    $options['date_format'] = array('default' => 'themed');
    return $options;
  }
  function options_form(&$form, &$form_state) {
    parent::options_form($form, $form_state);
    $form['date_format']['#options']['themed'] = t('Themed (changes based on recency)');
    $form['date_format']['#default_value'] = isset($this->options['date_format']) ? $this->options['date_format'] : 'themed';
  }
  function render($values) {
    $value = $values->{$this->field_alias};
    $format = $this->options['date_format'];
    $custom_format = '';
    if (in_array($format, array('custom', 'raw time ago', 'time ago', 'raw time span', 'time span'))) {
      $custom_format = $this->options['custom_date_format'];
    }
    if (!$value) {
      // TODO Please change this theme call to use an associative array for the $variables parameter.
      return theme('views_nodate');
    }
    else {
      $time_diff = REQUEST_TIME - $value; // will be positive for a datetime in the past (ago), and negative for a datetime in the future (hence)
      switch ($format) {
        case 'raw time ago':
          return format_interval($time_diff, is_numeric($custom_format) ? $custom_format : 2);
        case 'time ago':
          return t('%time ago', array('%time' => format_interval($time_diff, is_numeric($custom_format) ? $custom_format : 2)));
        case 'raw time span':
          return ($time_diff < 0 ? '-' : '') . format_interval(abs($time_diff), is_numeric($custom_format) ? $custom_format : 2);
        case 'time span':
          $args = array('%time' => format_interval(abs($time_diff), is_numeric($custom_format) ? $custom_format : 2));
          if ($time_diff < 0) {
            return t('%time hence', $args);
          }
          return t('%time ago', $args);
        case 'custom':
          return format_date($value, $format, $custom_format);
        case 'themed':
          return theme('facebook_status_time', array('time' => $value));
        default:
          return format_date($value, $format);
      }
    }
  }
}
