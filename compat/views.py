from django.shortcuts import render_to_response
from django.template import RequestContext

def compat(request):
    """Check browser compatibility"""

    context = {}

    return render_to_response('compat/compat.html', context, context_instance=RequestContext(request))
