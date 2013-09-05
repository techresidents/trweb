import json
import re

from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.staticfiles.templatetags.staticfiles import static

from trpycore.encode.basic import basic_encode
from techresidents_web.api.client import ApisvcClient
from techresidents_web.common.decorators import developer_required

@developer_required
def developer(request):
    """Developer application view"""

    encoded_user_id = basic_encode(request.user.id)
    client = ApisvcClient(request.session.session_key)
    current_user_json = client.user(user_id=encoded_user_id)
    
    app_js = 'js/apps/developer/apps/developer/src/main.js'
    app_url = static(app_js)
    app_md5_ext = ""
    
    #if app_url contains an md5 extension, extract it and
    #pass it to the template for use with requirejs
    md5_regex = re.compile(r".*(?P<md5_ext>\.[0-9a-f]{12})\..*")
    md5_match = md5_regex.match(app_url)
    if md5_match:
        app_md5_ext = md5_match.groupdict().get("md5_ext")
    
    context = {
        "GA_TRACK_PAGE_VIEW": False, #Page tracking will happen in app router
        "current_user_json": json.dumps(current_user_json),
        "app_md5_ext": app_md5_ext
    }
    
    return render_to_response('developer/developer.html', context, context_instance=RequestContext(request))
