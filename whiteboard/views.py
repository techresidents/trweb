from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.decorators import login_required

from techresidents_web.common.decorators import staff_required

@staff_required
def whiteboard(request):
    context = {}
    return render_to_response('whiteboard/whiteboard.html', context,  context_instance=RequestContext(request))
