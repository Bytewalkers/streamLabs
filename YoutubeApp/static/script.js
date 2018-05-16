$(document).ready(function() {
  window.appData = {
    videosData: {},
    endPonts: {
      LOGIN: '/login',
      CHECK_LOGGEDIN: '/api/check-login',
      GET_LIST: '/api/list-live-videos',
      GET_CHAT: '/api/get-chat-data',
      SEARCH_CHAT: '/api/search-chat'
    },
    chat: {
      ELEMENT: '',
      ID: '',
      CHAT_ID: '',
      LOAD: false,
      QUERY: '',
      CHAT_MSG_IDS: []
    }
  }

  if(typeof window.jQuery !== 'undefined' && window.jQuery) {
    $("#content > div").hide()
    $("#loginView").show()
    $('#content').removeClass('hidden')

    setVideoView = (id) => {
      console.log(window.appData.videosData)
      $('#videoView .videoContainer').html('<iframe id="ytplayer" type="text/html"\
        src="https://www.youtube.com/embed/' + window.location.hash.substr(1) + '?autoplay=1&showinfo=0&vq=highres&rel=0&loop=1&playlist=' + window.location.hash.substr(1) + '"\
        frameborder="0"></iframe>\
      ')
      window.appData.chat.ELEMENT = '.chatContainer';
      window.appData.chat.CHAT_ID = window.appData.videosData[id]['chatId'];
      window.appData.chat.ID = id;
      window.appData.chat.LOAD = true;
      $("#content > div").hide();
      $("#videoView").fadeIn();
    }

    showError = (msg) => {
      msg = typeof msg !== 'undefined' && msg.length > 0 ? msg : 'Something went wrong.'
      $('.ui.negative.message .header').text(msg)
      $('.ui.negative.message').removeClass('hidden')
      $('.ui.negative.message').show()
    }
    setListView = () => {
        $('.loader').parents().removeClass('active')
        $("#content > div").hide()
        $("#listView").show()
        window.appData.chat.LOAD = false;
    }

    loadChatMsg = (callback) => {
      if (window.appData.chat.LOAD) {
        let url = window.appData.endPonts.GET_CHAT
          + '?chat-id=' + window.appData.chat.CHAT_ID
          + (window.appData.chat.QUERY.length > 0 ? '&q=' + window.appData.chat.QUERY : '')
        console.log('url ', url)
        console.log(window.appData.chat.QUERY)
        $.ajax({
          url: url
        }).done((resp) => {
          if(resp.success) {
            let ele = $(window.appData.chat.ELEMENT)
            ele.empty()
            for(k in resp.data) {
              ele.append('<div class="comment" id="' + k + '">\
                <div class="content">\
                  <a class="author">' + resp.data[k]['authorName'] + '</a>\
                  <div class="metadata">\
                    <span class="date">' + resp.data[k]['time'] + '</span>\
                  </div>\
                  <div class="text">' + resp.data[k]['msg'] + '</div>\
                </div>\
              </div>')
            }
            ele.scrollTop(ele.prop("scrollHeight"));
          } else {
            showError(resp.msg)
          }
        }).fail((resp) => {
          showError()
        });
      }
      setTimeout(callback, 10000)
    }

    getVideoList = (ele, refresh=false) => {
      let url = window.appData.endPonts.GET_LIST + (refresh ? '?refresh=1&q=sports' : '')
      $.ajax({
        url: url
      }).done((resp) => {
        if(resp.success) {
          $(ele).empty()
          window.appData.videosData = resp.data
          $.each(resp.data, function(k, v) {
            $(ele).append('<div class="column">\
              <div id="' + k + '" class="ui fluid card">\
                <a class="image" href="/#' + k + '">\
                  <img src="/static/square-image.png" data-src="' + v.thumbnail + '">\
                </a>\
                <div class="content">\
                  <a class="header truncate" href="/#' + k + '">' + v.title + '</a>\
                  <div class="meta">\
                    <a>' + v.channelTitle + '</a>\
                  </div>\
                  <div class="description truncate3">' + v.description + '</div>\
                </div>\
              </div>\
            </div>');
            setTimeout(setListView, 0)
          })
        } else {
          showError(resp.msg)
        }
      }).fail((resp) => {
        showError()
      });
    }

    if(typeof window.location.hash !== 'undefined' && window.location.hash.length > 0) {
      window.location.replace('/');
    }
    $(window).on('hashchange', function(e){
      setVideoView(window.location.hash.substr(1))
    });

    $('#loginButton').bind('click', (e) => {
      window.location.replace(window.appData.endPonts.LOGIN);
    })
    $('i.icon.redo').bind('click', (e) => {
      console.log($(this))
      setTimeout(getVideoList('#cards', true), 0)
    })
    $('.ui.negative.message i.close').on('click', () => {
      $(this).parent().hide()
    })

    $("input#searchInput").keyup((e) => {
      window.appData.chat.QUERY = $("input#searchInput").val()
      console.log(window.appData.chat.QUERY, $(this).val())
    });

    $.ajax({
      url: window.appData.endPonts.CHECK_LOGGEDIN
    }).done((resp) => {
      if(resp.success) {
        setTimeout(getVideoList('#cards'), 0)
      } else {
        $('.loader').parents().removeClass('active')
        $("#content > div").hide()
        $("#loginView").show()
      }
    }).fail((resp) => {
      $('#content').text('Something went wrong.')
        $('.loader').parents().removeClass('active')
    });
    (function chatTimeoutFunction(){
        loadChatMsg(chatTimeoutFunction);
      })();
  }
});
