import json

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

import OpenTokSDK

from trpycore.encode.basic import basic_encode, basic_decode
from techresidents_web.chat import forms
from techresidents_web.chat import models
from techresidents_web.common.models import Topic


@login_required
def list(request):
    """ List all chats """

    #Get all chat sessions for the current user
    chat_sessions = models.ChatSession.objects.filter(users=request.user).select_related("chat", "chat__topic").order_by("-chat.start")

    chat_session_contexts = []
    for chat_session in chat_sessions:
        chat_session_contexts.append({
            "id": basic_encode(chat_session.id),
            "topic": chat_session.chat.topic,
            "start": chat_session.chat.start
        })
    
    context = {
        "chat_sessions": chat_session_contexts
    }
    
    return render_to_response('chat/list.html', context, context_instance=RequestContext(request))

@login_required
def chat(request, encoded_chat_session_id):
    """Commence a chat"""
    
    chat_session_id = basic_decode(encoded_chat_session_id)

    opentok = OpenTokSDK.OpenTokSDK(
            settings.TOKBOX_API_KEY,
            settings.TOKBOX_API_SECRET, 
            settings.TOKBOX_IS_STAGING) 

    
    #Get the specified chat. User filter must be present for security.
    chat_session = models.ChatSession.objects.select_related("chat").get(
            id=chat_session_id,
            users=request.user,
            chat__start__lte=timezone.now())
    
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
        user_json = {
            'id': user.id,
            'name': user.first_name,
            'imageUrl': request.build_absolute_uri('%simg/person.jpg' % settings.STATIC_URL),
        }    
        
        #Add the current to the head of the list
        if request.user.id == user.id:
            users.insert(0, user_json)
        else:
            users.append(user_json)

    # Update the session with active chat information to make it available to chatsvc
    request.session["chat_session"] = {
        'chat_session_token': chat_session.token,
        'chat_user_token': chat_user.token,
        'chat_users': users
    }
    request.session.modified = True
    
    #resources
    resources = []

    #topics
    topics = []
    topic_tree = Topic.objects.topic_tree(chat_session.chat.topic_id)
    for topic in topic_tree:
        
        #TODO optimize resources queries
        topic_resources = []
        for resource in topic.resources.all():
            topic_resources.append(resource.id)
            resource_json = {
                "id": resource.id,
                "type": resource.type.name,
                "document": {
                    "id": resource.documentresource.document.id,
                    "name": resource.documentresource.document.name,
                    "documentUrl": request.build_absolute_uri("/document/embed/%s" % resource.documentresource.document.id),
                }
            }
            resources.append(resource_json)

        topics.append({
            "id": topic.id,
            "parentId": topic.parent_id,
            "level": topic.level,
            "title": topic.title,
            "description": topic.description,
            "duration": topic.duration,
            "rank": topic.rank,
            "userId": topic.user_id,
            "resources": topic_resources,
        })

    context = {
        'TOKBOX_JS_URL': settings.TOKBOX_JS_URL,
        'TR_XD_REMOTE': settings.TR_XD_REMOTE,
        'chat_api_key': settings.TOKBOX_API_KEY,
        'chat_session_id': basic_encode(chat_session.id),
        'chat_session_token': chat_session.token,
        'chat_user_token': chat_user.token,
        'users' : users_by_id,
        'users_json': json.dumps(users),
        'topics_json': json.dumps(topics),
        'resources_json': json.dumps(resources),
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
            chat = models.Chat.objects.create(topic=topic, start=timezone.now(), end=timezone.now()) 

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


#Marking feedback form csrf exempt for now,
#This should be changed to support CSRF in the 
#future, but the risk is very low, since this
#view only allows the submission of chat feedback.
@csrf_exempt
@login_required
def feedback(request, encoded_chat_session_id):
    chat_session_id = basic_decode(encoded_chat_session_id)

    if request.method == 'POST':
        form = forms.ChatFeedbackForm(request, chat_session_id, data=request.POST)
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(settings.LOGIN_REDIRECT_URL)
        else:
            return HttpResponseRedirect(settings.LOGIN_REDIRECT_URL)
