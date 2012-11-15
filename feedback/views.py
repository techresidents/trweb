
from django.contrib.auth.decorators import login_required
from django.shortcuts import render_to_response
from django.template import RequestContext


@login_required
def feedback(request):
    """ Allow users to leave us feedback. """

    context = {
    }

    return render_to_response('feedback/feedback.html', context, context_instance=RequestContext(request))

