import os
import argparse

from .GoogleAPI import GoogleAPI

from flask import Flask, render_template, session, request

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
    if not query:
        query = 'gaming'
    if refresh:
        return appApi.videoList(session, query, True)
    else:
        return appApi.videoList(session, query)


@app.route(appApi.endPoints['CHAT_DATA'])
def youtubeChatData():
    chatId = request.args.get('chat-id')
    query = request.args.get('q')
    if chatId:
        return appApi.getChatData(session, chatId, query)
    else:
        return appApi.getResponseObj(False, 'Insufficient Parameters. Require chat-id.')
