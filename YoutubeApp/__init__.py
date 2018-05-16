import os
import argparse
import json
import httplib2
from .GoogleAPI import GoogleAPI
from googleapiclient.errors import HttpError
from google.auth.exceptions import RefreshError

from flask import Flask, render_template, session, request, redirect

CLIENT_SECRETS_FILE = "client_secret.json"
SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']
API_SERVICE_NAME = 'youtube'
API_VERSION = 'v3'

VALID_BROADCAST_STATUSES = ('all', 'active', 'completed', 'upcoming',)

app = Flask(__name__, static_url_path='/static')

app.secret_key = 'REPLACE ME - this value is here as a placeholder.'
appApi = GoogleAPI()


@app.route('/')
def youtubeIndex():
    return render_template('index.html')


@app.route('/test')
def youtubeTest():
    return render_template('test.html')


@app.route('/static/<path:path>')
def youtubeStatic(path):
    return send_from_directory('', path)


@app.route('/login')
def youtubeLogin():
    return appApi.authorize(session)


@app.route('/oauth2callback')
def oauth2callback():
    return appApi.oauth2callback(session)


@app.route('/logout')
def youtubeLogout():
    return appApi.clearCredentials(session)

# API endpoints


@app.route(appApi.endPoints['API_ROOT'])
def youtubeApi():
    return render_template('api.html')


@app.route(appApi.endPoints['CHECK_LOGIN_STATUS'])
def youtubeCheckStatus():
    return appApi.checkCredentials(session)


@app.route(appApi.endPoints['VIDEO_LIST'])
def youtubeListVideos():
    refresh = request.args.get('refresh')
    query = request.args.get('q')
    try:
        if not query:
            query = 'gaming'
        if refresh:
            return appApi.videoList(session, query, True)
        else:
            return appApi.videoList(session, query)

    except HttpError as h:
        print('YoutubeApp: HttpError whie loading videoList ', h)
        return appApi.getResponseObj(
            False,
            'An HTTP error occurred'
        )
    except httplib2.ServerNotFoundError as sn:
        print('YoutubeApp: ServerNotFoundError whie loading videoList ', sn)
        return appApi.getResponseObj(
            False,
            'Server Unable to reach googleapis.com'
        )
    except RefreshError as r:
        print('YoutubeApp: RefreshError found whie loading videoList ', r)
        return appApi.getResponseObj(
            False,
            'Please login again.'
        )
    except BaseException as be:
        print('YoutubeApp: BaseException found whie loading videoList ', be)
        return appApi.getResponseObj(
            False,
            'Something went wrong on the server.'
        )


@app.route(appApi.endPoints['CHAT_DATA'])
def youtubeChatData():
    chatId = request.args.get('chat-id')
    query = request.args.get('q')
    try:
        if chatId:
            return appApi.getChatData(session, chatId, query)
        else:
            return appApi.getResponseObj(
                False, 'Insufficient Parameters. Require chat-id.')

    except HttpError as h:
        print('YoutubeApp: HttpError whie loading chat ', h)
        return appApi.getResponseObj(
            False,
            'An HTTP error occurred'
        )
    except httplib2.ServerNotFoundError as sn:
        print('YoutubeApp: ServerNotFoundError whie loading chat ', sn)
        return appApi.getResponseObj(
            False,
            'Server Unable to reach googleapis.com'
        )
    except RefreshError as r:
        print('YoutubeApp: RefreshError found whie loading chat ', r)
        return appApi.getResponseObj(
            False,
            'Please login again.'
        )
    except BaseException as be:
        print('YoutubeApp: BaseException found whie loading chat ', be)
        return appApi.getResponseObj(
            False,
            'Something went wrong on the server.'
        )
