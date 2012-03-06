from django.conf import settings
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.views.decorators.cache import never_cache

from accounts.forms import LoginForm

@never_cache
def landing(request):
    #if request.user.is_authenticated:
    #    return HttpResponseRedirect('/home')
    
    form = LoginForm()

    context = {
            'LOGIN_URL': settings.LOGIN_URL,
            'form': form
            }

    return render_to_response('common/landing.html', context,  context_instance=RequestContext(request))

@never_cache
def learn_more(request):
    context = {}
    return render_to_response('common/learn_more.html', context,  context_instance=RequestContext(request))

@never_cache
def about(request):
    context = {}
    return render_to_response('common/about.html', context,  context_instance=RequestContext(request))

@never_cache
def contact(request):
    context = {}
    return render_to_response('common/contact.html', context,  context_instance=RequestContext(request))
