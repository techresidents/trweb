from django.conf import settings
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import loader, Context, RequestContext
from django.views.decorators.cache import never_cache

import forms
import models

@login_required
def loggedin(request):
    return render_to_response('accounts/loggedin.html', context_instance=RequestContext(request))

@never_cache
def login(request):
    redirect_to = request.REQUEST.get("next", settings.LOGIN_REDIRECT_URL)

    if request.method == "POST":
        form = forms.LoginForm(data=request.POST)
        if form.is_valid():
            auth.login(request, form.get_user())

            if not request.POST.get("remember_me", None):
                request.session.set_expiry(0)

            if request.session.test_cookie_worked():
                request.session.delete_test_cookie()

            return HttpResponseRedirect(redirect_to)
    else:
        form = forms.LoginForm()
    
    context = {
            "form": form,
            "next": redirect_to,
    }

    return render_to_response('accounts/login.html', context,  context_instance=RequestContext(request))

def logout(request):
    auth.logout(request)
    redirect_to = request.REQUEST.get("next", settings.LOGIN_URL)
    return HttpResponseRedirect(redirect_to)



def register(request):
    if request.method == "POST":
        user_form = forms.RegisterUserForm(data=request.POST)
        user_profile_form = forms.RegisterUserProfileForm(data=request.POST)

        if user_form.is_valid() and user_profile_form.is_valid():
            user = user_form.save(commit=False)
            user.save()

            user_profile = user_profile_form.save(commit=False)
            user_profile.user = user
            user_profile.save()

            return HttpResponseRedirect("/accounts/loggedin/")
    else:
        user_form = forms.RegisterUserForm()
        user_profile_form = forms.RegisterUserProfileForm()
    
    context = {
            "user_form" : user_form,
            "user_profile_form" : user_profile_form
    }

    return render_to_response('accounts/register.html', context,  context_instance=RequestContext(request))


def profile(request):
    return render_to_response('accounts/profile.html',  context_instance=RequestContext(request))
