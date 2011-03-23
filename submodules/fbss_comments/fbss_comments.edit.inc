<?php

/**
 * @file
 *   Edit and delete forms for the Facebook-style Statuses Comments module.
 */

/**
 * The edit form for status comments.
 *
 * @param $comment
 *   The comment object for the status comment being edited.
 */
function fbss_comments_edit($form, $form_state, $comment) {
  $form = array();
  $form['status-comment-edit'] = array(
    '#type' => 'textarea',
    '#rows' => 3,
    '#required' => TRUE,
    '#default_value' => $comment->comment,
  );
  $form['save'] = array(
    '#type' => 'submit',
    '#value' => t('Update'),
  );
  $form['#cid'] = $comment->cid;
  return $form;
}

/**
 * The submit handler for the edit form for status comments.
 */
function fbss_comments_edit_submit($form, &$form_state) {
  // TODO Please review the conversion of this statement to the D7 database API syntax.
  /* db_query("UPDATE {fbss_comments} SET comment = '%s' WHERE cid = %d", $form_state['values']['status-comment-edit'], $form['#cid']) */
  db_update('fbss_comments')
  ->fields(array(
    'comment' => $form_state['values']['status-comment-edit'],
  ))
  ->condition('cid', $form['#cid'])
  ->execute();
  $c = fbssc_load($form['#cid']);
  module_invoke_all('fbss_comments_after_save', $c, TRUE);
  if ($_GET['destination'] && $_GET['destinaton'] != 'fbss_comments/js/refresh') {
    $form_state['redirect'] = $_GET['destination'];
  }
  else {
    $form_state['redirect'] = '<front>';
  }
  drupal_set_message(t('Status comment has been successfully edited.'));
}

/**
 * The delete form for status comments.
 *
 * @param $comment
 *   The comment object for the status comment being deleted.
 */
function fbss_comments_delete($form, $form_state, $comment) {
  $form = array();
  $form['infotext'] = array(
    '#value' => '<p>' . t('Are you sure you want to permanently delete the status comment %comment?',
      array('%comment' => $comment->comment)) . '</p>',
  );
  $form['confirm'] = array(
    '#type' => 'submit',
    '#value' => t('Confirm'),
    '#submit' => array('fbss_comments_delete_confirm'),
  );
  $form['back'] = array(
    '#type' => 'submit',
    '#value' => t('Cancel'),
    '#submit' => array('fbss_comments_delete_cancel'),
  );
  $form['#cid'] = $comment->cid;
  return $form;
}

/**
 * The confirmation submit handler for the delete form for status comments.
 */
function fbss_comments_delete_confirm($form, &$form_state) {
  fbss_comments_delete_comment($form['#cid']);
  drupal_set_message(t('Status comment deleted.'));
  if ($_GET['destination'] && $_GET['destinaton'] != 'fbss_comments/js/refresh') {
    $form_state['redirect'] = $_GET['destination'];
  }
  else {
    $form_state['redirect'] = '<front>';
  }
}

/**
 * The cancellation submit handler for the delete form for status comments.
 */
function fbss_comments_delete_cancel($form, &$form_state) {
  drupal_set_message(t('Status comment was not deleted.'));
  if ($_GET['destination'] && $_GET['destinaton'] != 'fbss_comments/js/refresh') {
    $form_state['redirect'] = $_GET['destination'];
  }
  else {
    $form_state['redirect'] = '<front>';
  }
}
