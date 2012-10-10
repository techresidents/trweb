import datetime

from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.utils import timezone

from trpycore.encode.basic import basic_encode, basic_decode
from techresidents_web.common.decorators import staff_required
from techresidents_web.common.models import Topic
from techresidents_web.topic import forms


@staff_required
def create(request):
    """Create chat session"""
    
    topic_json = "[]"

    if request.method == 'POST':
        form = forms.TopicForm(request, data=request.POST)
        if form.is_valid():
            form.save(commit=True)
            #TODO redirect to some other page
            return HttpResponseRedirect(reverse("topic.views.create"))
        else:
            topic_json = form.data.get("topics")

    else:
        form = forms.TopicForm(request)
    
    context = {
            "form": form,
            "topic_json": topic_json
            }
    
    return render_to_response('topic/create.html', context,  context_instance=RequestContext(request))


@login_required
def details(request, encoded_topic_id):
    """Display topic details.

    This topic view allows users to create
    a chat for the specified topic.
    """
    topic_id = basic_decode(encoded_topic_id)
    topic = Topic.objects.get(id=topic_id)
    topic_tree = Topic.objects.topic_tree(topic_id)

    # Chose an arbitrary topic duration to determine
    # if the topic should be consumed with 1 or 2 participants.
    if topic.duration <= 10:
        recommended_participants = '1 participant'
    else:
        recommended_participants = '2 participants'

    if request.method == 'POST':
        form = forms.CreatePrivateChatForm(request, topic_id, data=request.POST)
        if form.is_valid():
            chat, chat_session = form.save()
            if form.start_chat_now():
                return HttpResponseRedirect(reverse("chat.views.session_wait", args=[basic_encode(chat_session.id)]))
            else:
                # Chat was scheduled for a later time
                relative_chat_link = reverse("chat.views.details", args=[basic_encode(chat.id)])
                # Use the session cache to pass chat details
                request.session["topic_details_chat_start"] = chat.start
                request.session["topic_details_chat_link"] = request.build_absolute_uri(relative_chat_link)
                request.session.modified = True
                message = 'success' # dummy message
                messages.success(request, message)
                return HttpResponseRedirect(reverse("topic.views.details", args=[encoded_topic_id]))
    else:
        # Get the current time to set default field values
        today_utc = timezone.now()
        today_local = today_utc.astimezone(timezone.get_current_timezone())
        form = forms.CreatePrivateChatForm(request, topic_id, initial={
            'chat_time_radio_btns':'1',
            'chat_date': today_local.strftime('%m/%d/%Y'),
            'chat_time':'12:00 PM'})

    context = {
        "encoded_topic_id": encoded_topic_id,
        "topic": topic,
        "topic_tree": topic_tree,
        "recommended_participants": recommended_participants,
        "form": form,
        "chat_start": request.session.pop("topic_details_chat_start", None),
        "chat_link": request.session.pop("topic_details_chat_link", None)
    }

    return render_to_response('topic/details.html', context, context_instance=RequestContext(request))
