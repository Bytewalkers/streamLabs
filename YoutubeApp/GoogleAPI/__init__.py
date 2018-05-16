import os
import google.oauth2.credentials
import googleapiclient.discovery
from googleapiclient.errors import HttpError
import google_auth_oauthlib.flow
from datetime import datetime, timezone

from flask import Flask, url_for, redirect, request, jsonify

class GoogleAPI:
    def __init__(self):
        self.CLIENT_SECRETS_FILE = "client_secret.json"
        self.SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']
        self.API_SERVICE_NAME = 'youtube'
        self.API_VERSION = 'v3'
        if os.environ.get('GOOGLE_CLIENT_SECRETS') is not None:
            with open(self.CLIENT_SECRETS_FILE, 'w') as secret_file:
                secret_file.write(os.environ.get('GOOGLE_CLIENT_SECRETS', None))

        self.endPoints = {
            'API_ROOT': '/api',
            'CHECK_LOGIN_STATUS': '/api/check-login',
            'VIDEO_LIST': '/api/list-live-videos',
            'CHAT_DATA': '/api/get-chat-data'
        }

    def authorize(self, session):
        flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
            self.CLIENT_SECRETS_FILE,
            scopes=self.SCOPES
        )
        flow.redirect_uri = url_for('oauth2callback', _external=True)
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        session['state'] = state
        return redirect(authorization_url)

    def oauth2callback(self, session):
        state = session['state']
        flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
            self.CLIENT_SECRETS_FILE,
            scopes=self.SCOPES,
            state=state
        )
        flow.redirect_uri = url_for('oauth2callback', _external=True)
        authorization_response = request.url
        flow.fetch_token(authorization_response=authorization_response)
        credentials = flow.credentials
        session['credentials'] = self.credentials2Dict(credentials)
        return redirect('/')

    def clearCredentials(self, session):
        if 'credentials' in session:
            del session['credentials']
        return redirect('/')


    def checkCredentials(self, session):
        if 'credentials' in session:
            return self.getResponseObj(True, 'User Logged In')
        return self.getResponseObj(False, 'User Logged Out')

    def videoList(self, session, query, refresh=False):
        if 'credentials' not in session:
            return self.getResponseObj(False,'Please login')

        # Cached
        if hasattr(self, 'listOfLiveVideos') and not refresh:
            return self.getResponseObj(True, '200', self.listOfLiveVideos)

        credentials = google.oauth2.credentials.Credentials(**session['credentials'])
        youtube = googleapiclient.discovery.build(
            self.API_SERVICE_NAME,
            self.API_VERSION,
            credentials=credentials
        )
        videoData = {}
        try:
            videoData = self.fetchVideoList(
                youtube,
                part='id,snippet',
                maxResults=20,
                q=query,
                type='video',
                topicId=query,
                eventType='live',
                order='viewCount'
            )
            self.listOfLiveVideos = videoData
        except HttpError as e:
            return self.getResponseObj(
                False,
                'An HTTP error occurred'
            )
        except:
            return redirect('/logout')

        return self.getResponseObj(True, '200',videoData)

    def fetchVideoList(self, youtube, **kwargs):
        response = youtube.search().list(**kwargs).execute()
        items = response['items']
        videoList = {}
        for k in items:
            t = {}
            t['id'] = k['id']['videoId']
            t['title'] = k['snippet']['title']
            t['channelTitle'] = k['snippet']['channelTitle']
            t['description'] = k['snippet']['description']
            t['publishedAt'] = k['snippet']['publishedAt']
            if 'thumbnails' in k['snippet'] and 'high' in k['snippet']['thumbnails']:
                t['thumbnail'] = k['snippet']['thumbnails']['high']['url']

            videoList[t['id']] = t

        videoIdsStr = ','.join(videoList.keys())
        chatIds = self.fetchChatIds(
            youtube,
            part='snippet,liveStreamingDetails',
            id=videoIdsStr
        )
        for k in chatIds.keys():
            videoList[k]['chatId'] = chatIds[k]

        return videoList

    def fetchChatIds(self, youtube, **kwargs):
        response = youtube.videos().list(**kwargs).execute()
        items = response['items']

        chatIds = {d['id']: d['liveStreamingDetails']['activeLiveChatId'] for d in items if 'liveStreamingDetails' in d and 'activeLiveChatId' in d['liveStreamingDetails'] }
        return chatIds

    def getChatData(self, session, chatId, query):
        credentials = google.oauth2.credentials.Credentials(**session['credentials'])
        youtube = googleapiclient.discovery.build(
            self.API_SERVICE_NAME,
            self.API_VERSION,
            credentials=credentials
        )
        chatData = youtube.liveChatMessages().list(
            liveChatId=chatId,
            part='id,snippet,authorDetails'
        ).execute()
        chatItems = chatData['items']
        chatList = {
            d['id']: {
            'id': d['id'],
            'authorName': d['authorDetails']['displayName'],
            'msg': d['snippet']['displayMessage'],
            'time': d['snippet']['publishedAt']
        } for d in chatItems}

        if not query:
            chatListFiltered = chatList
        else:
            chatListFiltered = {
                k: chatList[k] for k in chatList if chatList[k]['authorName'].lower() == query.lower()
            }

        #for k in chatList:
        #    print(datetime.strptime(chatList[k]['time']))
        #print chatList
        #print chatList.sort(key=lambda x:x['time'])
        # {k for k in chat}
        return self.getResponseObj(True, 'Chat data found', chatListFiltered)

    def credentials2Dict(self, credentials):
      return {'token': credentials.token,
              'refresh_token': credentials.refresh_token,
              'token_uri': credentials.token_uri,
              'client_id': credentials.client_id,
              'client_secret': credentials.client_secret,
              'scopes': credentials.scopes}

    def getResponseObj(self, flag, msg, data={}):
        return jsonify({
            'success': flag,
            'msg': msg,
            'data': data
        })
