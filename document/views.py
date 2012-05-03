from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext

from techresidents_web.document.forms import UploadForm
from techresidents_web.document.models import Document

@login_required
def upload(request):
    """Upload document"""

    if request.method == 'POST':
        form = UploadForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(reverse("document.views.upload"))
    else:
        form = UploadForm()
    
    context = {
        "form": form,
    }
    
    return render_to_response('document/upload.html', context,  context_instance=RequestContext(request))

@login_required
def viewer(request, document_id):
    """View document"""
    
    width = int(request.GET.get("width", 800))
    height = int(request.GET.get("height", 600))
    document = Document.objects.get(id=document_id)

    #print document.path.url
    context = {
        #"url": document.path.url,
        "url": "http://www.cs.usfca.edu/courses/cs682/calendar/dynamo.pdf",
        "width": width,
        "height": height,
        "doc": document.path,
    }
    
    return render_to_response('document/viewer.html', context,  context_instance=RequestContext(request))
