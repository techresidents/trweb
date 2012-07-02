from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect, Http404
from django.shortcuts import render_to_response
from django.template import RequestContext

from techresidents_web.common.decorators import staff_required
from techresidents_web.document.forms import UploadForm
from techresidents_web.document.models import Document

@staff_required
def upload(request):
    """Upload document"""

    if request.method == "POST":
        form = UploadForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(reverse("document.views.upload"))
    else:
        form = UploadForm()
    
    context = {
        "form": form,
    }
    
    return render_to_response("document/upload.html", context,  context_instance=RequestContext(request))

@login_required
def download(request, document_id):
    """Download document"""
    try:
        document = Document.objects.get(id=document_id)
        return HttpResponseRedirect(document.path.url)
    except ObjectDoesNotExist:
        raise Http404

@login_required
def view(request, document_id):
    """View document"""
    
    width = int(request.GET.get("width", 800))
    height = int(request.GET.get("height", 600))

    try:
        document = Document.objects.select_related("mime_type").get(id=document_id)
    except ObjectDoesNotExist:
        raise Http404
    

    is_code_doc = True
    if document.mime_type.extension in [".doc", ".docx", ".pdf", ".xls", ".xlsx"]:
        is_code_doc = False

    context = {
        "is_code_doc": is_code_doc,
        "doc": document.path,
        "width": width,
        "height": height,
    }
    
    return render_to_response("document/view.html", context,  context_instance=RequestContext(request))

@login_required
def embed(request, document_id):
    """View document"""
    
    width = int(request.GET.get("width", 800))
    height = int(request.GET.get("height", 600))

    try:
        document = Document.objects.select_related("mime_type").get(id=document_id)
    except ObjectDoesNotExist:
        raise Http404
    

    is_code_doc = True
    if document.mime_type.extension in [".doc", ".docx", ".pdf", ".xls", ".xlsx"]:
        is_code_doc = False
    
    context = {
        "is_code_doc": is_code_doc,
        "doc": document.path,
        "width": width,
        "height": height,
    }
    
    return render_to_response("document/embed.html", context,  context_instance=RequestContext(request))
