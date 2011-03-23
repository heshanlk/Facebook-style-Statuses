Drupal.behaviors.fbss_comments = function (context) {
  $('.fbss-comments-show-comment-form').one('click', function() {
    $(this).hide();
    $('#'+ this.id +' + div').show();
    return false;
  });
  $('.fbss-comments-show-comment-form-inner').one('click', function() {
    $(this).hide();
    $('#'+ this.id +' + div').show();
    return false;
  });
  $('a.fbss-comments-show-comments').one('click', function() {
    $(this).hide();
    $('#'+ this.id +' ~ div.fbss-comments-hide').show();
    return false;
  });
}
