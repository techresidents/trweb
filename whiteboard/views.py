from django.shortcuts import render_to_response
from django.template import RequestContext

def whiteboard(request):
    context = {}
    return render_to_response('whiteboard/whiteboard.html', context,  context_instance=RequestContext(request))
