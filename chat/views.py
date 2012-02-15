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

    #Get all chats for the current user and their associated topics
    #chats = models.Chat.objects.filter(users__id=request.user.id).select_related("topic")
    chats = models.Chat.objects.filter(users=request.user).select_related("topic")

    chatContexts = []
    for chat in chats:
        chatContexts.append({
            "id": chat.id,
            "topic": chat.topic,
            "start": chat.start
        })
    
    context = {
        "chats": chatContexts
    }
    
    return render_to_response('chat/list.html', context, context_instance=RequestContext(request))

@login_required
def chat(request, chat_id):
    """Commence a chat"""

    opentok = OpenTokSDK.OpenTokSDK(
            settings.TOKBOX_API_KEY,
            settings.TOKBOX_API_SECRET, 
            settings.TOKBOX_IS_STAGING) 

    
    #Get the specified chat. User filter must be present for security.
    chat = models.Chat.objects.get(id=chat_id, users=request.user, start__lte=datetime.now())

    #Get the associated chat_user and use that token if it exists, otherwise create it.
    chat_user = models.ChatUser.objects.get(chat=chat, user=request.user)
    if not chat_user.token:
        token = opentok.generate_token(chat.chat_session_id, connection_data = json.dumps({"id": request.user.id}))
        chat_user.token = token
        chat_user.save()
   
    # Create JSON user objects and pass down to the javascript app through template
    users = []
    for user in chat.users.all():
        user = {
            'id': user.id,
        }    
        
        #Add the current to the head of the list
        if request.user.id == user["id"]:
            users.insert(0, user)
        else:
            users.append(user)

    context = {
        'TR_XD_REMOTE': settings.TR_XD_REMOTE,
        'chat_api_key': settings.TOKBOX_API_KEY,
        'chat_session_id': chat.chat_session_id,
        'chat_session_token': chat_user.token,
        'users_json': json.dumps(users)
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
            topic = Topic.objects.get(id = 1)

            #create chat
            chat = models.Chat.objects.create(chat_session_id=session.session_id, topic=topic, start=datetime.now(), end=datetime.now()) 
            
            #Add users to the chat
            #We cant' simply add the users to chat.users since we specified 
            #a custom linking table, chat_user, which is also used to hold 
            #user specific chat authentication tokens.
            for user in [request.user, User.objects.get(username = form.cleaned_data["username"])]:
                models.ChatUser.objects.create(chat=chat, user=user)

            return HttpResponseRedirect(reverse("chat.views.list"))
    else:
        form = forms.CreateChatForm(request)
    
    context = {
            "form": form,
    }

    return render_to_response('chat/create.html', context,  context_instance=RequestContext(request))
