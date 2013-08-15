import base64
import os

from django.core.urlresolvers import reverse
from django.conf import settings
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.template.loader import get_template
from django.views.decorators.cache import never_cache

from techresidents_web.accounts import forms
from techresidents_web.accounts.models import OneTimePassword



@never_cache
def login(request):
    redirect_to = request.REQUEST.get("next", settings.LOGIN_REDIRECT_URL)

    #build absolute url and replace https with http
    redirect_to = request.build_absolute_uri(redirect_to).replace("https:", "http:")

    if request.method == 'POST':
        form = forms.LoginForm(data=request.POST)
        if form.is_valid():
            if request.session.test_cookie_worked():
                request.session.delete_test_cookie()

            if not request.POST.get('remember_me', None):
                request.session.set_expiry(0)
            
            user = form.get_user()
            request.session['tenant_id'] = user.tenant_id
            request.session['timezone'] = user.timezone

            if user.otp_enabled:
                otp = OneTimePassword.objects.get(
                        type__name="TOTP",
                        user_id=user.id)
                request.session["otp"] = {
                    "user": user,
                    "otp": otp
                }
                return HttpResponseRedirect(reverse('accounts.views.login_otp'))
            else:
                auth.login(request, form.get_user())
                return HttpResponseRedirect(redirect_to)
    else:
        form = forms.LoginForm()
    
    context = {
            'form': form,
            'next': redirect_to,
            }

    return render_to_response('accounts/login.html', context,  context_instance=RequestContext(request))

@never_cache
def login_otp(request):
    redirect_to = request.REQUEST.get("next", settings.LOGIN_REDIRECT_URL)

    #build absolute url and replace https with http
    redirect_to = request.build_absolute_uri(redirect_to).replace("https:", "http:")

    if request.method == 'POST':
        data = request.session["otp"]
        form = forms.LoginOTPForm(data["otp"], data=request.POST)
        if form.is_valid():
            auth.login(request, data["user"])
            del request.session["otp"]
            return HttpResponseRedirect(redirect_to)
    else:
        form = forms.LoginOTPForm()
    
    context = {
            'form': form,
            'next': redirect_to,
            }

    return render_to_response('accounts/login_otp.html', context,  context_instance=RequestContext(request))

def account_request(request):
    if request.method == 'POST':
        form = forms.AccountRequestForm(data=request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Success')
            return HttpResponseRedirect(reverse('accounts.views.account_request'))
    else:
        form = forms.AccountRequestForm()
    
    context = {
        'form' : form,
    }

    return render_to_response('accounts/account_request.html', context,  context_instance=RequestContext(request))

def register(request, account_request_code=None):
    """Register user with or without account request code.
    
    In order to force user registration to require a valid 
    account request code set the REGISTRATION_REQUIRES_CODE
    setting to True. This will adjust the register url,
    forcing the account_request_code to be present.
    
    Args:
        request: request object
        account_request_code: optional account request code. If not None,
            a valid account_request must exist in the database with
            the provided code in order for registration to be allowed.
    """
    if request.method == 'POST':
        user_form = forms.RegisterUserForm(request, account_request_code, data=request.POST)

        if user_form.is_valid():
            user = user_form.save()

            #login the new user
            auth.login(request, user)

            #Only sending email validation if registration is not being
            #done with an account request code. If registering with
            #account request code, we've already validated email.
            if account_request_code is None:
                text_template = get_template('accounts/registration_email.txt')
                html_template = get_template('accounts/registration_email.html')
                
                user_form.send_activation_email(
                        subject = "Tech Residents - Registration",
                        text_template = text_template,
                        html_template = html_template
                        )
            
            return HttpResponseRedirect(settings.REGISTRATION_SUCCESS_URL)
    else:
        user_form = forms.RegisterUserForm(request, account_request_code, initial={'timezone': settings.TIME_ZONE})
    
    context = {
        'user_form' : user_form,
        'account_request_code': account_request_code,
    }

    return render_to_response('accounts/register.html', context,  context_instance=RequestContext(request))

def register_success(request):
    """This is a page with no UI to facilitate tracking
    developers that successfully register."""
    return HttpResponseRedirect(settings.LOGIN_REDIRECT_URL)

def register_employer(request, account_request_code=None):
    """Register user with or without account request code.
    
    In order to force user registration to require a valid 
    account request code set the REGISTRATION_REQUIRES_CODE
    setting to True. This will adjust the register url,
    forcing the account_request_code to be present.
    
    Args:
        request: request object
        account_request_code: optional account request code. If not None,
            a valid account_request must exist in the database with
            the provided code in order for registration to be allowed.
    """
    if request.method == 'POST':
        user_form = forms.RegisterEmployerForm(request, account_request_code, data=request.POST)

        if user_form.is_valid():
            user_form.save()

            #Only sending email validation if registration is not being
            #done with an account request code. If registering with
            #account request code, we've already validated email.
            if account_request_code is None:
                text_template = get_template('accounts/registration_email.txt')
                html_template = get_template('accounts/registration_email.html')
                
                user_form.send_activation_email(
                        subject = "Tech Residents - Registration",
                        text_template = text_template,
                        html_template = html_template
                        )

            return HttpResponseRedirect(reverse('accounts.views.register_activate'))
    else:
        user_form = forms.RegisterEmployerForm(request, account_request_code, initial={'timezone': settings.TIME_ZONE})
    
    context = {
        'user_form' : user_form,
        'account_request_code': account_request_code,
    }

    return render_to_response('accounts/register_employer.html', context,  context_instance=RequestContext(request))

def register_activate(request, registration_code=None):
    success = False
    if request.method == 'POST':
        registration_code = request.POST["registration_code"]
    
    if registration_code is not None:
        form = forms.RegistrationActivationForm(allow_reactivation=True, data={'registration_code': registration_code})

        if form.is_valid():
            form.activate()
            success = True
            messages.success(request, "Successful")
            return HttpResponseRedirect(reverse('accounts.views.register_activate'))

    else:        
        form = forms.RegistrationActivationForm(allow_reactivation=True)

    context = {
        'form': form,
        'success': success,
    }

    return render_to_response('accounts/register_activate.html', context,  context_instance=RequestContext(request))

def forgot_password(request):
    success = False

    if request.method == 'POST':
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
            'form': form,
            'success': success,
            }

    return render_to_response('accounts/forgot_password.html', context,  context_instance=RequestContext(request))

def reset_password(request, reset_password_code):
    success = False

    if request.method == 'POST':
        form = forms.ResetPasswordForm(reset_password_code, data=request.POST)
        if form.is_valid():
            form.reset_password()
            success = True
    else:
        form = forms.ResetPasswordForm(reset_password_code)
    
    context = {
            'form': form,
            'reset_password_code': reset_password_code,
            'success': success
            }

    return render_to_response('accounts/reset_password.html', context,  context_instance=RequestContext(request))

@login_required
def otp(request):
    if request.method == 'POST':
        form = forms.OTPForm(request, data=request.POST)
        secret = form.data["secret"]

        if form.is_valid():
            form.save(commit=True)
            messages.success(request, "Save successful")
            return HttpResponseRedirect(reverse('accounts.views.otp'))
    else:
        try:
            otp = OneTimePassword.objects.get(
                    type__name="TOTP",
                    user=request.user)
            secret = otp.secret
        except OneTimePassword.DoesNotExist:
            secret = base64.b32encode(os.urandom(10))
        
        form_data = {
            "enable": request.user.otp_enabled,

            "secret": secret
        }
        form = forms.OTPForm(request, data=form_data)
    
    context = {
        'email': request.user.username,
        'form': form,
        'secret': secret,
    }

    return render_to_response('accounts/otp.html', context,  context_instance=RequestContext(request))

@login_required
def logout(request):
    auth.logout(request)
    redirect_to = request.REQUEST.get("next", settings.LOGIN_URL)
    return HttpResponseRedirect(redirect_to)

@login_required
def password(request):
    if request.method == 'POST':
        form = forms.ProfilePasswordForm(request, data=request.POST)
        if form.is_valid():
            form.save(commit=True)
            messages.success(request, "Password successfully changed")
            return HttpResponseRedirect(reverse('accounts.views.password'))
    else:
        form = forms.ProfilePasswordForm(request)

    context = {
        'form': form
    }
    return render_to_response('accounts/password.html', context, context_instance=RequestContext(request))
