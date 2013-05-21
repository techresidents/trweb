
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext

from trpycore.encode.basic import basic_encode
from techresidents_web.common.decorators import staff_required
from techresidents_web.topic import forms


@staff_required
def create(request):
    """Create chat session"""
    
    topic_json = "[]"

    if request.method == 'POST':
        form = forms.TopicForm(request, data=request.POST)
        if form.is_valid():
            created_models_list = form.save(commit=True)
            root_topic = created_models_list[0] # Root topic is expected to be 1st in list
            return HttpResponseRedirect(reverse("topic.views.details", args=[basic_encode(root_topic.id)]))
        else:
            topic_json = form.data.get("topics")

    else:
        form = forms.TopicForm(request)
    
    context = {
            "form": form,
            "topic_json": topic_json
            }
    
    return render_to_response('topic/create.html', context,  context_instance=RequestContext(request))
