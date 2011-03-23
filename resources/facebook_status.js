var allowClickRefresh = true;
Drupal.behaviors.facebookStatus = function (context) {
  var initialLoad = false;
  // Drupal passes document as context on page load.
  if (context == document) {
    initialLoad = true;
  }
  // Make sure we can run context.find().
  var ctxt = $(context);
  facebook_status_submit_disabled = false;
  var $facebook_status_field = ctxt.find('.facebook-status-text:first');
  var facebook_status_original_value = $facebook_status_field.val();
  var fbss_maxlen = Drupal.settings.facebook_status.maxlength;
  var fbss_hidelen = parseInt(Drupal.settings.facebook_status.hideLength);
  var refreshIDs = Drupal.settings.facebook_status.refreshIDs;
  if ($.fn.autogrow && $facebook_status_field) {
    // jQuery Autogrow plugin integration.
    $facebook_status_field.autogrow({expandTolerance: 2});
  }
  if (Drupal.settings.facebook_status.autofocus) {
    $facebook_status_field.focus();
  }
  if (Drupal.settings.facebook_status.noautoclear || Drupal.settings.facebook_status.autofocus) {
    if ($facebook_status_field.val() && $facebook_status_field.val().length != 0) {
      fbss_print_remaining(fbss_maxlen - facebook_status_original_value.length, $facebook_status_field.parent().next());
    }
  }
  else {
    $.each(ctxt.find('.facebook-status-text-main'), function(i, val) {
      $(this).addClass('facebook-status-faded');
    });
    // Clear the status field the first time it's in focus if it hasn't been changed.
    ctxt.find('.facebook-status-text-main').one('focus', function() {
      if ($(this).val() == facebook_status_original_value) {
        $(this).val('');
        fbss_print_remaining(fbss_maxlen, $(this).parent().next());
      }
      $(this).removeClass('facebook-status-faded');
    });
  }
  // Truncate long status messages.
  if (fbss_hidelen > 0) {
    ctxt.find('.facebook-status-content').each(function() {
      var th = $(this);
      var oldMsgText = th.html();
      var oldMsgLen = oldMsgText.length;
      if (oldMsgLen > fbss_hidelen) {
        var newMsgText =
          oldMsgText.substring(0, fbss_hidelen - 1) +
          '<span class="facebook-status-hellip">&hellip;&nbsp;</span><a class="facebook-status-readmore-toggle active">' +
          Drupal.t('Read more') +
          '</a><span class="facebook-status-readmore">' +
          oldMsgText.substring(fbss_hidelen - 1) +
          '</span>';
        th.html(newMsgText);
        th.find('.facebook-status-readmore').hide();
        th.find('.facebook-status-readmore-toggle').click(function(e) {
          e.preventDefault();
          var pa = $(this).parents('.facebook-status-content');
          $(this).hide();
          pa.find('.facebook-status-hellip').hide();
          pa.find('.facebook-status-readmore').show();
        });
      }
    });
  }
  // Fix bad redirect destinations.
  ctxt.find('.facebook-status-edit a, .facebook-status-delete a, a.facebook-status-respond, a.facebook-status-repost').each(function() {
    var loc = $(this).attr('href').split('?'), base = loc[0], query = '';
    if (loc[1]) {
      var search = window.location.search;
      if (search.indexOf('?q=') == 0) {
        search = search.substring(3);
      }
      // window.location.href doesn't work for sites not in the webroot with weird server configurations.
      var destination = escape(window.location.pathname.substring(Drupal.settings.basePath.length) + search);
      var q = loc[1].split('&');
      for (var i = 0; i < q.length; i++) {
        var item = q[i].split('='), param = item[0];
        if (i == 0) {
          query += '?';
        }
        else {
          query += '&';
        }
        query += param +'=';
        if (param == 'destination') {
          query += destination;
        }
        else if (item[1]) {
          query += item[1];
        }
      }
      $(this).attr('href', base + query);
    }
  });
  // React when a status is submitted.
  ctxt.find('#facebook-status-replace').bind('ahah_success', function(context) {
    if ($(context.target).html() != $(this).html()) {
      return;
    }
    if (Drupal.heartbeat) {
      Drupal.heartbeat.pollMessages();
    }
    // Refresh elements by re-loading the current page and replacing the old version with the updated version.
    var loaded = {};
    if (refreshIDs && refreshIDs != undefined) {
      var loaded2 = {};
      $.each(refreshIDs, function(i, val) {
        if (val && val != undefined) {
          if ($.trim(val) && loaded2[val] !== true) {
            loaded2[val] = true;
            var element = $(val);
            element.before('<div class="fbss-remove-me ahah-progress ahah-progress-throbber" style="display: block; clear: both; float: none;"><div class="throbber">&nbsp;</div></div>');
          }
        }
      });
      // IE will cache the result unless we add an identifier (in this case, the time).
      $.get(window.location.pathname +"?ts="+ (new Date()).getTime(), function(data, textStatus) {
        // From load() in jQuery source. We already have the scripts we need.
        var new_data = data.replace(/<script(.|\s)*?\/script>/g, "");
        // From ahah.js. Apparently Safari crashes with just $().
        var new_content = $('<div></div>').html(new_data);
        if (textStatus != 'error' && new_content) {
          // Replace relevant content in the viewport with the updated version.
          $.each(refreshIDs, function(i, val) {
            if (val && val != undefined) {
              if ($.trim(val) != '' && loaded[val] !== true) {
                var element = $(val);
                var insert = new_content.find(val);
                if (insert.get() != element.get()) {
                  element.replaceWith(insert);
                  Drupal.attachBehaviors(insert);
                }
                loaded[val] = true;
              }
            }
          });
        }
        $('.fbss-remove-me').remove();
      });
    }
    else {
      $('.fbss-remove-me').remove();
    }
  });
  // On document load, add a refresh link where applicable.
  if (initialLoad && refreshIDs && Drupal.settings.facebook_status.refreshLink) {
    var loaded = {};
    $.each(refreshIDs, function(i, val) {
      if (val && val != undefined) {
        if ($.trim(val) && loaded[val] !== true) {
          loaded[val] = true;
          var element = $(val);
          element.wrap('<div></div>');
          var rlink = '<a href="'+ window.location.href +'">'+ Drupal.t('Refresh') +'</a>';
          element.parent().after('<div class="facebook-status-refresh-link">'+ rlink +'</div>');
        }
      }
    });
  }
  // Refresh views appropriately.
  ctxt.find('.facebook-status-refresh-link a').click(function() {
    if (allowClickRefresh) {
      allowClickRefresh = false;
      setTimeout('allowRefresh()', 2000);
      $(this).after('<div class="fbss-remove-me ahah-progress ahah-progress-throbber"><div class="throbber">&nbsp;</div></div>');
      $('#facebook-status-replace').trigger('ahah_success', {target: '#facebook-status-replace'});
    }
    return false;
  });
  // Restore original status text if the field is blank and the slider is clicked.
  ctxt.find('.facebook-status-intro').click(function() {
    if ($(this).next().find('.facebook-status-text').val() == '') {
      $(this).next().find('.facebook-status-text').val(facebook_status_original_value);
      fbss_print_remaining(fbss_maxlen - facebook_status_original_value.length, $(this).parents('.facebook-status-update').find('.facebook-status-chars'));
    }
  });
  // Count remaining characters.
  ctxt.find('.facebook-status-text').keypress(function(fbss_key) {
    var th = $(this);
    var thCC = th.parents('.facebook-status-update').find('.facebook-status-chars');
    setTimeout(function() {
      var fbss_remaining = fbss_maxlen - th.val().length;
      fbss_print_remaining(fbss_remaining, thCC);
    }, 10);
  });
}
// Change remaining character count.
function fbss_print_remaining(fbss_remaining, where) {
  if (fbss_remaining >= 0) {
    where.html(Drupal.formatPlural(fbss_remaining, '1 character left', '@count characters left', {}));
    if (facebook_status_submit_disabled) {
      $('.facebook-status-submit').attr('disabled', false);
      facebook_status_submit_disabled = false;
    }
  }
  else if (Drupal.settings.facebook_status.maxlength != 0) {
    where.html('<span class="facebook-status-negative">'+ Drupal.formatPlural(Math.abs(fbss_remaining), '-1 character left', '-@count characters left', {}) +'</span>');
    if (!facebook_status_submit_disabled) {
      $('.facebook-status-submit').attr('disabled', true);
      facebook_status_submit_disabled = true;
    }
  }
}
//Disallow refreshing too often or double-clicking the Refresh link.
function allowRefresh() {
  allowClickRefresh = !allowClickRefresh;
}
