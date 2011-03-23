<?php

/**
 * @file
 *   Displays individual status updates.
 *
 * See http://drupal.org/node/226776 for a list of default variables.
 *
 * Other variables available:
 * - $sid: The status message ID
 * - $meta: Information about the context of the status message, like "In response to [recipient]"
 * - $self: Whether the status is an update to the sender's own status
 * - $page: Whether the status is being displayed on its own page
 * - $type: The recipient type
 * - $recipient: The recipient object
 * - $recipient_name: The (safe) recipient name
 * - $recipient_link: A link to the recipient
 * - $recipient_picture: The recipient's picture, if applicable
 * - $sender: The sender object
 * - $sender_name: The (safe) sender name
 * - $sender_link: A themed link to the sender
 * - $sender_picture: The sender's picture
 * - $created: The themed message created time
 * - $message: The themed status message
 * - $links: Status links (edit/delete/respond/share)
 * - $status: The status object
 * - $context: The context array
 *
 * If the Facebook-style Statuses Comments module is enabled, these variables
 * are also available:
 * - $comments: Comments on the relevant status plus the form to leave a comment
 *
 * Other modules may add additional variables.
 */
?>

<div id="facebook-status-item-
<?php
echo $sid;
?>
" class="facebook-status-item facebook-status-type-
<?php
echo $type;
?>
<?php
if ($self) :
?>
 facebook-status-self-update
<?php
