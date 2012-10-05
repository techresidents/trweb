from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext

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

    This topic view also allows users to create
    a chat with the specified topic.
    """
    topic_id = basic_decode(encoded_topic_id)
    topic = Topic.objects.get(id=topic_id)
    topic_tree = Topic.objects.topic_tree(topic_id)

    if request.method == 'POST':
        form = forms.CreatePrivateChatForm(request, topic_id, data=request.POST)
        if form.is_valid():
            chat  = form.save()
            message = "Success %s" % reverse("chat.views.details", args=[basic_encode(chat.id)])
            messages.success(request, message)
            return HttpResponseRedirect(reverse("topic.views.details", args=[encoded_topic_id]))
        else:
            print 'form is invalid'
    else:
        form = forms.CreatePrivateChatForm(request, topic_id)

    context = {
        "encoded_topic_id": encoded_topic_id,
        "topic": topic,
        "topic_tree": topic_tree,
        "form": form
    }

    return render_to_response('topic/details.html', context, context_instance=RequestContext(request))
