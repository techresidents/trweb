import json

from django.shortcuts import render_to_response
from django.template import RequestContext

from trpycore.encode.basic import basic_encode
from techresidents_web.api.client import ApisvcClient
from techresidents_web.common.decorators import developer_required

@developer_required
def developer(request):
    """Developer application view"""

    encoded_user_id = basic_encode(request.user.id)
    client = ApisvcClient(request.session.session_key)
    current_user_json = client.user(user_id=encoded_user_id)

    context = {
        "GA_TRACK_PAGE_VIEW": False, #Page tracking will happen in app router
        "current_user_json": json.dumps(current_user_json)
    }
    
    return render_to_response('developer/developer.html', context, context_instance=RequestContext(request))
