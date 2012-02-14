import json

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext

from common.models import Topic

import forms

@login_required
def create(request):
    """Create chat session"""

    if request.method == 'POST':
        form = forms.TopicForm(request, data=request.POST)
        if form.is_valid():
            topics = form.save(commit=True)
            
            #TODO redirect
    else:
        form = forms.TopicForm(request)
    
    context = { form: form }

    return render_to_response('topic/create.html', context,  context_instance=RequestContext(request))
