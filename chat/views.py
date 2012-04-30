import json

from datetime import datetime

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext

import OpenTokSDK

import forms
import models
from common.models import Topic


@login_required
def list(request):
    """ List all chats """

    #Get all chat sessions for the current user
    chat_sessions = models.ChatSession.objects.filter(users=request.user).select_related("chat", "chat__topic")

    chat_session_contexts = []
    for chat_session in chat_sessions:
        chat_session_contexts.append({
            "id": chat_session.id,
            "topic": chat_session.chat.topic,
            "start": chat_session.chat.start
        })
    
    context = {
        "chat_sessions": chat_session_contexts
    }
    
    return render_to_response('chat/list.html', context, context_instance=RequestContext(request))

@login_required
def chat(request,chat_session_id):
    """Commence a chat"""

    opentok = OpenTokSDK.OpenTokSDK(
            settings.TOKBOX_API_KEY,
            settings.TOKBOX_API_SECRET, 
            settings.TOKBOX_IS_STAGING) 

    
    #Get the specified chat. User filter must be present for security.
    chat_session = models.ChatSession.objects.select_related("chat").get(
            id=chat_session_id,
            users=request.user,
            chat__start__lte=datetime.now())

    #Get the associated chat_user and use that token if it exists, otherwise create it.
    chat_user = models.ChatUser.objects.get(chat_session=chat_session, user=request.user)
    if not chat_user.token:
        token = opentok.generate_token(chat_session.token, connection_data = json.dumps({"id": request.user.id}))
        chat_user.token = token
        chat_user.save()
    
    users_by_id = [user for user in chat_session.users.order_by('id')]

    # Create JSON user objects and pass down to the javascript app through template
    users = []
    for user in chat_session.users.all():
        user = {
            'id': user.id,
        }    
        
        #Add the current to the head of the list
        if request.user.id == user["id"]:
            users.insert(0, user)
        else:
            users.append(user)

    # Update the session with active chat information to make it available to chatsvc
    request.session["chat_session"] = {
        'chat_session_token': chat_session.token,
        'chat_user_token': chat_user.token,
        'chat_users': users
    }
    request.session.modified = True
    
    #topics
    topics = []
    topic_tree = Topic.objects.topic_tree(chat_session.chat.topic_id)
    for topic in topic_tree:
        topics.append({
            "id": topic.id,
            "parentId": topic.parent_id,
            "level": topic.level,
            "title": topic.title,
            "description": topic.description,
            "duration": topic.duration,
            "rank": topic.rank,
            "userId": topic.user_id
        })
    
    context = {
        'TR_XD_REMOTE': settings.TR_XD_REMOTE,
        'chat_api_key': settings.TOKBOX_API_KEY,
        'chat_session_token': chat_session.token,
        'chat_user_token': chat_user.token,
        'users' : users_by_id,
        'users_json': json.dumps(users),
        'topics_json': json.dumps(topics),
    }
    
    return render_to_response('chat/chat.html', context, context_instance=RequestContext(request))

@login_required
def create(request):
    """Create chat session"""

    if request.method == 'POST':
        form = forms.CreateChatForm(request, data=request.POST)
        if form.is_valid():
            opentok = OpenTokSDK.OpenTokSDK(
                    settings.TOKBOX_API_KEY,
                    settings.TOKBOX_API_SECRET, 
                    settings.TOKBOX_IS_STAGING) 
            
            #IP passed to tokbox when session is created will be used to determine
            #tokbox server location for chat session. Note that tokboxchat sessions
            #never expire. But tokbox user chat tokens can be set to expire.
            session = opentok.create_session(request.META['REMOTE_ADDR'])
            
            #TODO remove topic hard coding
            topic = Topic.objects.all()[0]

            #create chat
            chat = models.Chat.objects.create(topic=topic, start=datetime.now(), end=datetime.now()) 

            #create chat session
            chat_session = models.ChatSession.objects.create(chat=chat, token=session.session_id) 
            
            #Add users to the chat
            #We cant' simply add the users to chat.users since we specified 
            #a custom linking table, chat_user, which is also used to hold 
            #user specific chat authentication tokens.
            for user in [request.user, User.objects.get(username = form.cleaned_data["username"])]:
                models.ChatUser.objects.create(chat_session=chat_session, user=user)

            return HttpResponseRedirect(reverse("chat.views.list"))
    else:
        form = forms.CreateChatForm(request)
    
    context = {
            "form": form,
    }

    return render_to_response('chat/create.html', context,  context_instance=RequestContext(request))
