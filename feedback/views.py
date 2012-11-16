from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext

from techresidents_web.feedback import forms

@login_required
def feedback(request):
    """ Allow users to leave us feedback. """

    if request.method == 'POST':
        form = forms.FeedbackForm(request, data=request.POST)
        if form.is_valid():
            form.send()
            messages.success(request, 'Success')
            return HttpResponseRedirect(reverse('feedback.views.feedback'))
    else:
        form = forms.FeedbackForm(request)

    context = {
        'form' : form,
    }

    return render_to_response('feedback/feedback.html', context, context_instance=RequestContext(request))

