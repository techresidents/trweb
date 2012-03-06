from django.conf import settings
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.contrib.csrf.middleware import csrf_exempt
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.views.decorators.cache import never_cache

import forms

#Disable csrf for the login view since we support logging in
#from an http landing page which results in a POST from
#the http landing page to the https login page and 
#this will result in a failed referer check (403).
#Disabling the CSRF check for the login page is fairly
#safe since a cross site POST to the login page can't
#do much harm. Supporting a POST from http to https
#does make this pages vulnerable to man in the middle
#attacks. Support for this may be removed in the future.
@csrf_exempt
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

            return HttpResponseRedirect("/")
    else:
        user_form = forms.RegisterUserForm()
        user_profile_form = forms.RegisterUserProfileForm()
    
    context = {
            "user_form" : user_form,
            "user_profile_form" : user_profile_form
            }

    return render_to_response('accounts/register.html', context,  context_instance=RequestContext(request))

def forgot_password(request):
    success = False

    if request.method == "POST":
        form = forms.ForgotPasswordForm(data=request.POST)
        if form.is_valid():
            form.send_email()
            success = True
    else:
        form = forms.ForgotPasswordForm()
    
    context = {
            "form": form,
            "success": success,
            }

    return render_to_response('accounts/forgot_password.html', context,  context_instance=RequestContext(request))

def reset_password(request, reset_password_code):
    success = False

    if request.method == "POST":
        form = forms.ResetPasswordForm(reset_password_code, data=request.POST)
        if form.is_valid():
            form.reset_password()
            success = True
    else:
        form = forms.ResetPasswordForm(reset_password_code)
    
    context = {
            "form": form,
            "reset_password_code": reset_password_code,
            "success": success
            }

    return render_to_response('accounts/reset_password.html', context,  context_instance=RequestContext(request))


@login_required
def logout(request):
    auth.logout(request)
    redirect_to = request.REQUEST.get("next", settings.LOGIN_URL)
    return HttpResponseRedirect(redirect_to)

@login_required
def profile(request):
    return render_to_response('accounts/profile.html',  context_instance=RequestContext(request))
