from django.conf import settings
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.views.decorators.cache import never_cache

import version as version_num
from accounts.forms import LoginForm

@never_cache
def http403(request):
    context = {}
    response = render_to_response('common/403.html', context,  context_instance=RequestContext(request))
    response.status_code = 403
    return response

@never_cache
def http404(request):
    context = {}
    response = render_to_response('common/404.html', context,  context_instance=RequestContext(request))
    response.status_code = 404
    return response

@never_cache
def http500(request):
    context = {}
    response = render_to_response('common/500.html', context,  context_instance=RequestContext(request))
    response.status_code = 500
    return response

@never_cache
def version(request):
    context = {
            'version': version_num.VERSION,
            'build': version_num.BUILD 
            }

    return render_to_response('common/version.html', context,  context_instance=RequestContext(request))

@never_cache
def landing(request):

    #if the user is logged in forward them to the http version of the LOGIN_REDIRCT_URL
    if request.user.is_authenticated():
        redirect_to = request.build_absolute_uri(settings.LOGIN_REDIRECT_URL).replace("https:", "http:")
        return HttpResponseRedirect(redirect_to)
    
    login_url = settings.LOGIN_URL
    if settings.TR_LOGIN_USING_HTTPS:
        login_url = request.build_absolute_uri(login_url).replace("http:", "https:")

    form = LoginForm()

    context = {
            'LOGIN_URL': login_url,
            'form': form
            }

    return render_to_response('common/landing.html', context,  context_instance=RequestContext(request))

@never_cache
def landing_placeholder(request):
    context = {}
    return render_to_response('common/landing_placeholder.html', context,  context_instance=RequestContext(request))

@never_cache
def developer_faq(request):
    context = {}
    return render_to_response('common/developer_faq.html', context,  context_instance=RequestContext(request))

@never_cache
def employer_faq(request):
    context = {}
    return render_to_response('common/employer_faq.html', context,  context_instance=RequestContext(request))

@never_cache
def about(request):
    navbar_template = 'navbar_unauthenticated.html'
    if (request.user.is_authenticated()):
        navbar_template = 'navbar_authenticated.html'

    context = {
        'base_template': navbar_template
    }
    return render_to_response('common/about.html', context,  context_instance=RequestContext(request))

@never_cache
def contact(request):
    navbar_template = 'navbar_unauthenticated.html'
    if (request.user.is_authenticated()):
        navbar_template = 'navbar_authenticated.html'

    context = {
        'base_template': navbar_template
    }
    return render_to_response('common/contact.html', context,  context_instance=RequestContext(request))

