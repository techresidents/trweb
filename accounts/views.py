from django.conf import settings
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.contrib.csrf.middleware import csrf_exempt
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.template.loader import get_template
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

    #build absolute url and replace https with http
    redirect_to = request.build_absolute_uri(redirect_to).replace("https:", "http:")

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
        user_form = forms.RegisterUserForm(request, data=request.POST)

        if user_form.is_valid():
            user = user_form.save(commit=False)
            user.save()

            text_template = get_template('accounts/registration_email.txt')
            html_template = get_template('accounts/registration_email.html')
            
            user_form.send_activation_email(
                    subject = "Tech Residents - Registration",
                    text_template = text_template,
                    html_template = html_template
                    )
            
            #TODO should user be authenticated and send to home page
            return HttpResponseRedirect("/")
    else:
        user_form = forms.RegisterUserForm(request)
    
    context = {
            "user_form" : user_form,
            }

    return render_to_response('accounts/register.html', context,  context_instance=RequestContext(request))

def register_activate(request, registration_code):
    success = False

    form = forms.RegistrationActivationForm(allow_reactivation=True, data={"registration_code": registration_code})

    if form.is_valid():
        form.activate()
        success = True

    context = {
            "success": success,
            }

    return render_to_response('accounts/register_activate.html', context,  context_instance=RequestContext(request))

def forgot_password(request):
    success = False

    if request.method == "POST":
        form = forms.ForgotPasswordForm(request, data=request.POST)
        if form.is_valid():

            text_template = get_template('accounts/forgot_password_email.txt')
            html_template = get_template('accounts/forgot_password_email.html')
            
            form.send_email(
                    subject = "Tech Residents - Reset Password",
                    text_template = text_template,
                    html_template = html_template
                    )

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


def profile_account(request):
    return render_to_response('accounts/profile_account.html',  context_instance=RequestContext(request))


def profile_password(request):
    return render_to_response('accounts/profile_password.html',  context_instance=RequestContext(request))


def profile_notifications(request):
    return render_to_response('accounts/profile_notifications.html',  context_instance=RequestContext(request))

def ptidemo(request):
    return render_to_response('accounts/ptiDemo.html',  context_instance=RequestContext(request))
