$(document).ready(() => {
  if (typeof window.jQuery !== 'undefined' && window.jQuery) {
    class LiveApp {
      constructor () {
        this.data = {
          videosData: {},
          searchQuery: 'gaming',
          refreshCache: false,
          endPonts: {
            LOGIN: '/login',
            CHECK_LOGGEDIN: '/api/check-login',
            GET_LIST: '/api/list-live-videos',
            GET_CHAT: '/api/get-chat-data',
            SEARCH_CHAT: '/api/search-chat'
          },
          chat: {
            ELEMENT: '',
            VIDEO_ID: '',
            CHAT_ID: '',
            LOAD: false,
            QUERY: '',
            REFRESH_RATE: 4000,
            CHAT_MSG_IDS: []
          }
        }
      }

      setVideoData (data) {
        this.data.videosData = data
      }

      setChatData (data) {
        this.data.chat = Object.assign(this.data.chat, data)
      }

      setChatQuery (q) {
        this.data.chat.QUERY = q
      }

      setSearchQuery (q) {
        this.data.searchQuery = q
      }

      setChatLoad (f) {
        this.data.chat.LOAD = f
      }

      setRefresh (refresh = false) {
        this.data.refreshCache = refresh
      }

      getSearchQuery () {
        return this.data.searchQuery
      }

      getEndPoint (key) {
        return (
          typeof this.data.endPonts[key] !== 'undefined'
        ) ? this.data.endPonts[key] : ''
      }

      getVideoData (id) {
        return (typeof this.data.videosData[id] !== 'undefined')
          ? this.data.videosData[id] : {}
      }

      getChatElement () {
        return this.data.chat.ELEMENT
      }

      getChatRefreshRate () {
        return this.data.chat.REFRESH_RATE
      }

      isLoadChat () {
        return this.data.chat.LOAD
      }

      getChatMsg (callback) {
        if (this.data.chat.LOAD && this.data.chat.CHAT_ID.length > 0) {
          let url = this.data.endPonts.GET_CHAT +
            '?chat-id=' + this.data.chat.CHAT_ID +
            (this.data.chat.QUERY.length > 0 ? '&q=' + this.data.chat.QUERY : '')

          this.log('Loading chat', url)
          $.ajax(
            {url: url}
          ).done(
            (resp) => callback(resp)
          ).fail((e) => this.showError('Network/API failed.'))
        }
      }

      getVideoList (callback) {
        let url = this.data.endPonts.GET_LIST + '?q=' + this.data.searchQuery
        this.log('Fetching video list ', url)
        if (this.data.refreshCache) {
          url += '&refresh=1'
          this.data.refreshCache = false
        }
        $.ajax(
          {url: url}
        ).done(
          (resp) => callback(resp)
        ).fail((e) => this.showError('Network/API failed.'))
      }

      checkLogin (callback) {
        let url = this.data.endPonts.CHECK_LOGGEDIN
        $.ajax(
          {url: url}
        ).done(
          (resp) => callback(resp)
        ).fail((e) => this.showError('Network/API failed.'))
      }

      redirect (url) {
        if (typeof url !== 'undefined' && url.length > 0) { window.location.replace(url) }
      }

      log (m) {
        console.log(m)
      }

      showError (msg) {
        this.log('error')
        msg = typeof msg !== 'undefined' && msg.length > 0 ? msg : 'Something went wrong.'
        $('.ui.negative.message .header').text(msg)
        $('.ui.negative.message').removeClass('hidden')
        $('.ui.negative.message').show()
        setTimeout($('.ui.negative.message').hide(), 5000)
      }

      showLogin () {
        $('.loader').parents().removeClass('active')
        $('#content > div').hide()
        $('#loginView').show()
      }
    }

    let newApp = new LiveApp()

    let loadchatMsg = (callback) => {
      setTimeout(
        newApp.getChatMsg((resp) => {
          if (resp.success) {
            let chatContainer = $(newApp.getChatElement())
            chatContainer.empty()
            if(Object.keys(resp.data).length === 0 &&
              resp.data.constructor === Object
            ) {
                chatContainer.append('<div class="comment" id="empty">\
                  <div class="content">\
                    <a class="author"> Live Chat not available</a>\
                  </div>\
                </div>')
                newApp.setChatLoad(false)
            } else {
              for (let k in resp.data) {
                let time = new Date(resp.data[k]['timestamp'] * 1000).toLocaleString()
                // time = resp.data[k]['time']
                chatContainer.append('<div class="comment" id="' + resp.data[k]['id'] + '">\
                  <div class="content">\
                    <a class="author">' + resp.data[k]['authorName'] + '</a>\
                    <div class="metadata">\
                      <span class="date">' + time + ' GMT </span>\
                    </div>\
                    <div class="text">' + resp.data[k]['msg'] + '</div>\
                  </div>\
                </div>')
              }
            }
            chatContainer.scrollTop(chatContainer.prop('scrollHeight'))
          } else {
            newApp.showError(resp.msg)
          }
        })
      )
      setTimeout(callback, newApp.getChatRefreshRate())
    }

    let loadVideoList = () => {
      setTimeout(newApp.getVideoList((resp) => {
        let containerEle = '#listView > div'
        $(containerEle).empty()
        newApp.setVideoData(resp.data)
        $.each(resp.data, function (k, v) {
          $(containerEle).append('<div class="column">\
            <div id="' + k + '" class="ui fluid card">\
              <a class="image" href="/#' + k + '">\
                <img src="' + v.thumbnail + '">\
              </a>\
              <div class="content">\
                <a class="header truncate" href="/#' + k + '">' + v.title + '</a>\
                <div class="meta">\
                  <a>' + v.channelTitle + '</a>\
                </div>\
                <div class="description truncate3">' + v.description + '</div>\
              </div>\
            </div>\
          </div>')

          $('.loader').parents().removeClass('active')
          $('#content > div').hide()
          $('#listView').show()
          $('.right.menu').show()
          newApp.setChatLoad(false)
        })
      }), 0)
    }

    $('#content > div').hide()
    $('.right.menu').hide()
    $('#content').removeClass('hidden')

    // if page is loaded with hash, then user is redirected to Home
    if (typeof window.location.hash !== 'undefined' && window.location.hash.length > 0) {
      newApp.redirect('/')
    }
    $(window).on('hashchange', (e) => {
      let id = window.location.hash.substr(1)
      let videoData = newApp.getVideoData(id)
      let chatId = (typeof videoData['chatId'] !== 'undefined')
        ? videoData['chatId']
        : ''
      let title = (typeof videoData['title'] !== 'undefined')
        ? videoData['title']
        : ''
      let description = (typeof videoData['description'] !== 'undefined')
        ? videoData['description']
        : ''
      let channel = (typeof videoData['channelTitle'] !== 'undefined')
        ? videoData['channelTitle']
        : ''
      if (
        !(Object.keys(videoData).length === 0 &&
        videoData.constructor === Object)
      ) {
        $('#videoView .videoContainer').html('<h2>' +
          title +
          '</h2><div class="iframeContainer"><iframe id="ytplayer" type="text/html" src="https://www.youtube.com/embed/' +
          window.location.hash.substr(1) +
          '?autoplay=1&showinfo=0&vq=highres&rel=0&loop=1&playlist=' +
          window.location.hash.substr(1) + '"frameborder="0"></iframe></div>' +
          '<div><h3 style="padding-top: 10px;">' +
          channel +
          '</h3><h5 style="padding-top: 10px;">' +
          description +
          '</h5>'
        )
        newApp.setChatData({
          ELEMENT: '.chatContainer',
          CHAT_ID: chatId,
          VIDEO_ID: id,
          LOAD: true
        })
        $('#content > div').hide()
        $('#videoView').fadeIn()
      }
    })

    $('#loginButton').on('click', (e) => {
      newApp.redirect(newApp.getEndPoint('LOGIN'))
    })

    $('i.icon.redo').on('click', (e) => {
      newApp.setRefresh(true)
      loadVideoList()
    })

    $('.ui.negative.message i.close').on('click', () => {
      $(this).parent().hide()
    })

    $('input#chatInput').keyup((e) => {
      newApp.setChatQuery($('input#chatInput').val())
    })

    $('input#searchInput').keyup((e) => {
      newApp.setRefresh(true)
      newApp.setSearchQuery($('input#searchInput').val())
      loadVideoList()
    })
    $('input#searchInput').val(newApp.getSearchQuery())

    newApp.checkLogin((resp) => {
      if (resp.success) {
        newApp.setRefresh(true)
        loadVideoList()
      } else {
        newApp.showLogin()
      }
    });

    (function chatTimeoutFunction () {
      loadchatMsg(chatTimeoutFunction)
    })()
  }
})
