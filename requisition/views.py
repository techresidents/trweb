from django.shortcuts import render_to_response
from django.template import RequestContext

from techresidents_web.common.decorators import staff_required

@staff_required
def requisition(request):
    """Requisition application view"""

    context = {}

    return render_to_response('requisition/requisition.html', context, context_instance=RequestContext(request))

