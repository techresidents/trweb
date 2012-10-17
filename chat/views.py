
import json

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, HttpResponseForbidden, HttpResponseNotFound, Http404
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt

import OpenTokSDK

from trpycore.encode.basic import basic_encode, basic_decode
from techresidents_web.common.decorators import staff_required
from techresidents_web.common.models import Topic
from techresidents_web.chat.forms import CreateChatForm, ChatFeedbackForm
from techresidents_web.chat.models import Chat, ChatRegistration, ChatSession, ChatUser


def _build_chat_data(request, chat_session, chat_user):
    # Create JSON user objects and pass down to the javascript app through template
    users = []
    for user in chat_session.chat_users.select_related("user").all():
        user_json = {
            "id": user.user.id,
            "name": user.user.first_name,
            "imageUrl": None,
            "participant": user.participant,
        }    
        
        #Add the current to the head of the list
        if user.id == chat_user.id:
            users.insert(0, user_json)
        else:
            users.append(user_json)

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

    return {"users": users, "resources": resources, "topics": topics}

@staff_required
def create(request):
    """Create chat"""

    if request.method == 'POST':
        form = CreateChatForm(request, data=request.POST)
        if form.is_valid():
            chat, chat_session = form.save()
            if chat_session:
                message = "Success %s" % reverse("chat.views.session", args=[basic_encode(chat_session.id)])
            else:
                message = "Success %s" % reverse("chat.views.register", args=[basic_encode(chat.id)])
            messages.success(request, message)

            return HttpResponseRedirect(reverse("chat.views.create"))
    else:
        form = CreateChatForm(request)
    
    context = {
            "form": form,
    }

    return render_to_response('chat/create.html', context,  context_instance=RequestContext(request))


@login_required
def details(request, encoded_chat_id):
    chat_id = basic_decode(encoded_chat_id)
    chat = Chat.objects.select_related("chat__topic", "chat__type").get(id=chat_id)
    topic_tree = Topic.objects.topic_tree(chat.topic.id)

    try:
        if chat.type.name == "PRIVATE":
            is_registered = True
            is_checked_in = True
        else:
            registration = ChatRegistration.objects.get(user=request.user, chat=chat)
            is_registered = True
            is_checked_in = registration.checked_in
    except ChatRegistration.DoesNotExist:
        is_registered = False
        is_checked_in = False

    context = {
        "encoded_chat_id": basic_encode(chat.id),
        "chat": chat,
        "topic": chat.topic,
        "topic_tree": topic_tree,
        "is_registered": is_registered,
        "is_checked_in": is_checked_in
        }

    return render_to_response('chat/details.html', context, context_instance=RequestContext(request))

@login_required
def list(request):
    """ List all chats """

    #Get all chat sessions for the current user
    chat_sessions = ChatSession.objects.filter(users=request.user).select_related("chat", "chat__topic").order_by("-chat.start")

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
def register(request, encoded_chat_id):
    """ Register for a chat.
    """
    chat_id = basic_decode(encoded_chat_id)
    try:
        chat = Chat.objects.get(id=chat_id)
        if chat.registration_open:
            if not ChatRegistration.objects.filter(chat=chat, user=request.user).exists():
                registration = ChatRegistration(
                        chat=chat,
                        user=request.user,
                        checked_in=False)
                registration.save()
            return HttpResponseRedirect(reverse("home.views.home"))
        else:
            return HttpResponseForbidden("registration closed")

    except Chat.DoesNotExist:
        return HttpResponseNotFound()

@login_required
def checkin(request, encoded_chat_id):
    """Check-in for a chat.
    """
    chat_id = basic_decode(encoded_chat_id)
    try:
        chat = Chat.objects.get(id=chat_id)
        registration = ChatRegistration.objects.get(chat=chat, user=request.user)
        if not registration.checked_in:
            if chat.checkin_open:
                registration.checked_in = True
                registration.save()
            else:
                return HttpResponseForbidden("checkin closed")

        return HttpResponseRedirect(reverse("chat.views.wait", args=[encoded_chat_id]))
    
    except Chat.DoesNotExist, ChatRegistration.DoesNotExist:
        raise Http404
        return HttpResponseNotFound()

@login_required
def wait(request, encoded_chat_id):
    """ Directs user to waiting room to wait for a chat to start, based upon input chat ID.
    If the chat is open, the user is redirected to the chat app (chat.views.session).
    """
    chat_id = basic_decode(encoded_chat_id)
    try:
        chat = Chat.objects.select_related("chat__type").get(id=chat_id)
        if chat.expired:
            return HttpResponseForbidden("chat expired")

        chat_session = None
        if chat.type.name != "UNRESTRICTED":
            if chat.open:
                chat_session = ChatSession.objects.get(chat=chat)
        else:
            registration = ChatRegistration.objects.\
                    select_related("chat_session").\
                    get(chat=chat, user=request.user, checked_in=True)
            if chat.open:
                chat_session = registration.chat_session
        
        if chat_session:
            return HttpResponseRedirect(reverse("chat.views.session", args=[basic_encode(chat_session.id)]))
        else:
            context = {
                "chat_title": chat.topic.title,
                "chat_start": chat.start
            }
            return render_to_response('chat/wait.html', context, context_instance=RequestContext(request))

    except Chat.DoesNotExist:
        return HttpResponseNotFound()
    except ChatSession.DoesNotExist:
        return HttpResponseNotFound()
    except ChatRegistration.DoesNotExist:
        return HttpResponseNotFound()

@login_required
def session_wait(request, encoded_chat_session_id):
    """ Implements the same logic as wait, but takes a chat session ID as input.

    """
    chat_session_id = basic_decode(encoded_chat_session_id)
    try:
        chat_session = ChatSession.objects.\
                select_related("chat", "chat__type").\
                get(id=chat_session_id)
        chat = chat_session.chat

        if chat.open:
            return HttpResponseRedirect(reverse("chat.views.session", args=[basic_encode(chat_session.id)]))
        elif chat.expired:
            return HttpResponseForbidden("chat expired")
        else:
            context = {
                "chat_title": chat.topic.title,
                "chat_start": chat.start
            }
            return render_to_response('chat/session_wait.html', context, context_instance=RequestContext(request))

    except ChatSession.DoesNotExist:
        return HttpResponseNotFound()

@login_required
def session(request, encoded_chat_session_id):
    """Commence a chat"""
    
    chat_session_id = basic_decode(encoded_chat_session_id)

    #Get the specified chat.
    chat_session = ChatSession.objects.select_related("chat", "chat__type").get(
            id=chat_session_id)
    
    chat = chat_session.chat
    chat_type = chat_session.chat.type
    chat_user = None

    if chat.pending:
        return HttpResponseRedirect(reverse("chat.views.session_wait", args=[encoded_chat_session_id]))
    elif chat.expired:
        return HttpResponseForbidden("chat expired")
    elif chat_session.end is not None:
        return HttpResponseForbidden("chat session ended")

    if chat_type.name != "ANONYMOUS":
        if request.user.is_anonymous():
            return HttpResponseForbidden()
        chat_user = ChatSession.objects.get_or_create_chat_user(request.user, chat_session)
    else:
        if not request.user.is_anonymous():
            chat_user = ChatSession.objects.get_or_create_chat_user(request.user, chat_session)
        else:
            chat_session_data = request.session.get("chat_session")
            if chat_session_data:
                try:
                    chat_user = ChatUser.objects.get(
                            id=chat_session_data["chat_user_id"],
                            chat_session_id=chat_session_data["chat_session_id"])
                except ChatUser.DoesNotExist:
                    pass

            if chat_user is None:
                chat_user = ChatSession.objects.get_or_create_chat_user(request.user, chat_session)

    if not chat_user:
        return HttpResponseForbidden()

    # Create JSON user objects and pass down to the javascript app through template
    chat_data = _build_chat_data(request, chat_session, chat_user)

    if not chat_user.token:
        opentok = OpenTokSDK.OpenTokSDK(
                settings.TOKBOX_API_KEY,
                settings.TOKBOX_API_SECRET)
        token = opentok.generate_token(
                chat_session.token,
                connection_data=json.dumps(chat_data["users"][0]),
                role=OpenTokSDK.RoleConstants.MODERATOR)
        chat_user.token = token
        chat_user.save()


    #Update the session with active chat information to make it available to chatsvc.
    #Additionally, this will allow us to support anonymous users.
    request.session["chat_session"] = {
        'user_id': chat_user.user.id,
        'chat_session_id': chat_session.id,
        'chat_user_id': chat_user.id,
        'chat_session_token': chat_session.token,
        'chat_user_token': chat_user.token,
        'chat_users': chat_data["users"]
    }
    request.session.modified = True
    
    context = {
        'TOKBOX_JS_URL': settings.TOKBOX_JS_URL,
        'TR_XD_REMOTE': settings.TR_XD_REMOTE,
        'chat_api_key': settings.TOKBOX_API_KEY,
        'chat_session_id': basic_encode(chat_session.id),
        'chat_session_token': chat_session.token,
        'chat_user_token': chat_user.token,
        'chat_record_json': json.dumps(chat.record),
        'users_json': json.dumps(chat_data["users"]),
        'topics_json': json.dumps(chat_data["topics"]),
        'resources_json': json.dumps(chat_data["resources"]),
    }
    
    return render_to_response('chat/session.html', context, context_instance=RequestContext(request))

#Marking feedback form csrf exempt for now,
#This should be changed to support CSRF in the 
#future, but the risk is very low, since this
#view only allows the submission of chat feedback.
@csrf_exempt
@login_required
def session_feedback(request, encoded_chat_session_id):
    chat_session_id = basic_decode(encoded_chat_session_id)

    if request.method == 'POST':
        form = ChatFeedbackForm(request, chat_session_id, data=request.POST)
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(settings.LOGIN_REDIRECT_URL)
        else:
            return HttpResponseRedirect(settings.LOGIN_REDIRECT_URL)
