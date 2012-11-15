from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, HttpResponseForbidden
from django.shortcuts import render_to_response
from django.template import RequestContext

from techresidents_web.common.decorators import staff_required

@staff_required
def talent(request):
    """Talent application view"""
    
    context = {
        'TOKBOX_JS_URL': settings.TOKBOX_JS_URL,
        'chat_api_key': settings.TOKBOX_API_KEY,
    }
    
    return render_to_response('talent/talent.html', context, context_instance=RequestContext(request))
