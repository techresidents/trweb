from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext

from techresidents_web.common.decorators import staff_required
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
