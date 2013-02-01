import json

from django.shortcuts import render_to_response
from django.template import RequestContext

from trpycore.encode.basic import basic_encode
from techresidents_web.api.client import ApisvcClient
from techresidents_web.common.decorators import staff_required

@staff_required
def talent(request):
    """Talent application view"""

    encoded_user_id = basic_encode(request.user.id)
    client = ApisvcClient(request.session.session_key)
    current_user_json = client.user(user_id=encoded_user_id)

    context = {
        "current_user_json": json.dumps(current_user_json)
    }
    
    return render_to_response('talent/talent.html', context, context_instance=RequestContext(request))
