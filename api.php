<?php

/**
 * @file
 *   Defines API hooks for the Facebook-style Statuses module.
 */

/**
 * Alter user access.
 *
 * @param $allow
 *   Whether the action is permitted to be taken. Change this only if you can
 *   decide conclusively that the action is definitely (not) permitted.
 * @param $op
 *   The action being taken. One of add, converse, delete, edit, view,
 *   view_stream.
 * @param $args
 *   An array of additional arguments. Varies depending on $op.
 * @see facebook_status_user_access()
 */
function hook_facebook_status_user_access_alter(&$allow, $op, $args) {
  global $user;
  switch ($op) {
    case 'add':
      $recipient = isset($args[0]) ? $args[0] : $user;
      $type = isset($args[1]) ? $args[1] : 'user';
      $sender = isset($args[2]) ? $args[2] : $user;
      $context = facebook_status_determine_context($type);
      //Updating one's own status should ALWAYS be allowed.
      if ($type == 'user' && $context['handler']->recipient_id($recipient) == $sender->uid) {
        $allow = TRUE;
      }
      break;
  }
}

/**
 * Alter status save options.
 *
 * @param $options
 *   An associative array containing:
 *   - discard duplicates: Whether a new status containing exactly the same
 *     message as the previous status will be saved or discarded.
 *   - timed override: Whether a status update will be overwritten if a new one
 *     is submitted within FACEBOOK_STATUS_OVERRIDE_TIMER seconds.
 *   - discard blank statuses: Whether blank status messages will be discarded.
 * @see facebook_status_save_status()
 */
function hook_facebook_status_save_options($options) {
  //If we allow saving attachments with statuses, then we could have different
  //attachments with the same message, so we need to allow saving statuses with
  //duplicate messages.
  if (module_exists('fbsmp')) {
    $options['discard duplicates'] = FALSE;
  }
}

/**
 * Alter status links.
 *
 * @param $links
 *   A structured array as returned by implementations of hook_link().
 * @param $status
 *   A status object.
 * @see _facebook_status_show()
 */
function hook_facebook_status_link_alter(&$links, $status) {
  //Capitalize the first letter of every link.
  foreach ($links as $type => $data) {
    $links[$type]['title'] = drupal_ucfirst($links[$type]['title']);
  }
}

/**
 * Describe default values for stream context types.
 *
 * @return
 *   An associative array of associative arrays. The outer array keys indicate
 *   the context type (machine name). Inner arrays have these elements:
 *   - title: The "friendly" name of the context type.
 *   - description (optional): An explanation of who owns the recipient stream
 *     if this context is used. This will be displayed in a "title" attribute,
 *     so do not use double quotes.
 *   - handler: The name of a class that extends facebook_status_context (and
 *     thus defines useful methods to describe the context).
 *   - parent (optional): The name of the parent context type (not the
 *     parent handler).
 *   - dependencies (optional): An array containing the names of modules that
 *     must be enabled for that context type to be used.
 *   - selectors (optional): A string containing CSS selectors separated by
 *     newlines. Each selector will be automatically updated via AJAX when a
 *     new status of the relevant type is saved. Do not include selectors that
 *     include the status update form.
 *   - view (optional): The default view to use as the context stream.
 *   - weight (optional): The default precedence of the context type.
 *   - file (optional): A file to load before loading the context handler.
 * @see facebook_status_all_contexts()
 */
function hook_facebook_status_context_info() {
  $path = drupal_get_path('module', 'facebook_status');
  return array(
    'user' => array(
      'title' => t('User profiles'),
      'description' => t('If a profile is currently being viewed, then the stream belongs to the owner of that profile.') . ' ' .
        t('Otherwise, the stream belongs to the current user.'),
      'handler' => 'facebook_status_user_context',
      'view' => 'facebook_status_user_stream',
      'weight' => 9999,
      'file' => $path . '/includes/utility/facebook_status.contexts.inc',
    ),
    'node' => array(
      'title' => t('Nodes'),
      'description' => t('The stream belongs to the currently viewed node, if applicable.'),
      'handler' => 'facebook_status_node_context',
      'view' => 'facebook_status_node_stream',
      'weight' => 0,
      'file' => $path . '/includes/utility/facebook_status.contexts.inc',
    ),
  );
}

/**
 * React to a status being deleted.
 *
 * @param $sid
 *   The status ID.
 * @see facebook_status_delete_status()
 */
function hook_facebook_status_delete($sid) {
  if (module_exists('facebook_status_tags')) {
    // TODO Please review the conversion of this statement to the D7 database API syntax.
    /* db_query("DELETE FROM {facebook_status_tags} WHERE sid = %d", $sid) */
    db_delete('facebook_status_tags')
  ->condition('sid', $sid)
  ->execute();
  }
}

/**
 * React to a status being saved.
 *
 * @param $status
 *   The status object that was just saved.
 * @param $context
 *   The stream context array.
 * @param $edit
 *   TRUE if the incoming status was just edited; FALSE if the status is
 *   entirely new. Note that editing can mean either saving the edit form or
 *   overwriting a previous status by timed override.
 * @see facebook_status_save_status()
 * @see facebook_status_edit_submit()
 */
function hook_facebook_status_save($status, $context, $edit) {
  if ($edit) {
    drupal_set_message(t('The status message has been saved.'));
  }
  else {
    drupal_set_message(t('The status message has been updated.'));
  }
}

/**
 * Return a list of DOM selectors whose contents FBSS should automatically
 * update via AJAX when a new status is submitted from a status update form on
 * the same page. Do not select a region which includes the status update form.
 *
 * @param $recipient
 *   An object representing the recipient of the status message.
 * @param $type
 *   The context stream type.
 * @return
 *   An array of DOM selector expressions.
 * @see theme_facebook_status_form_display()
 */
function hook_facebook_status_refresh_selectors($recipient, $type) {
  //Automatically update all instances of the view that is displayed for this context.
  $context = facebook_status_determine_context($type);
  return array('.view-id-' . $context['view']);
}

/**
 * hook_link() is invoked with parameters 'facebook_status' and $status.
 * Implement it just like you would implement hook_link() with nodes.
 *
 * @param $type
 *   The type of link being processed.
 * @param $status
 *   The status object.
 * @return
 *   A structured array which will be run through drupal_render() to produce
 *   links that will be displayed with themed statuses.
 * @see facebook_status_link()
 */
