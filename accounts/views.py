import json

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
from django.views.decorators.csrf import csrf_exempt

from techresidents_web.accounts import forms
from techresidents_web.accounts.models import Skill
from techresidents_web.job.models import Prefs, PositionType, PositionTypePref, TechnologyPref, LocationPref
from techresidents_web.common.models import Technology, TechnologyType, ExpertiseType



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

    if request.method == 'POST':
        form = forms.LoginForm(data=request.POST)
        if form.is_valid():
            auth.login(request, form.get_user())

            if not request.POST.get('remember_me', None):
                request.session.set_expiry(0)

            if request.session.test_cookie_worked():
                request.session.delete_test_cookie()
            
            #set timezone in session so it's available to TimezoneMiddleware
            request.session['timezone'] = request.user.get_profile().timezone

            return HttpResponseRedirect(redirect_to)
    else:
        form = forms.LoginForm()
    
    context = {
            'form': form,
            'next': redirect_to,
            }

    return render_to_response('accounts/login.html', context,  context_instance=RequestContext(request))

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
            
            return HttpResponseRedirect(settings.LOGIN_REDIRECT_URL)
    else:
        user_form = forms.RegisterUserForm(request, account_request_code, initial={'timezone': settings.TIME_ZONE})
    
    context = {
        'user_form' : user_form,
        'account_request_code': account_request_code,
    }

    return render_to_response('accounts/register.html', context,  context_instance=RequestContext(request))

def register_activate(request, registration_code):
    success = False

    form = forms.RegistrationActivationForm(allow_reactivation=True, data={'registration_code': registration_code})

    if form.is_valid():
        form.activate()
        success = True

    context = {
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
def logout(request):
    auth.logout(request)
    redirect_to = request.REQUEST.get("next", settings.LOGIN_URL)
    return HttpResponseRedirect(redirect_to)

@login_required
def profile_account(request):
    if request.method == 'POST':
        form = forms.ProfileAccountForm(request, data=request.POST)
        if form.is_valid():
            form.save(commit=True)
            messages.success(request, "Save successful")

            #update timezone in session so user sees changes
            #without having to re-login.
            request.session['timezone'] = form.cleaned_data['timezone']

            return HttpResponseRedirect(reverse('accounts.views.profile_account'))
    else:
        user = request.user
        user_profile = request.user.get_profile()
        form_data = {
            'first_name':user.first_name,
            'last_name':user.last_name,
            'email_address':user.email,
            'timezone': user_profile.timezone or settings.TIME_ZONE,
        }
        if user_profile.developer_since is not None:
            form_data['developer_since'] = user_profile.developer_since.year
        form = forms.ProfileAccountForm(request, data=form_data)

    context = {
        'form': form,
    }

    return render_to_response('accounts/profile_account.html', context,  context_instance=RequestContext(request))

@login_required
def profile_password(request):
    if request.method == 'POST':
        form = forms.ProfilePasswordForm(request, data=request.POST)
        if form.is_valid():
            form.save(commit=True)
            messages.success(request, "Password successfully changed")
            return HttpResponseRedirect(reverse('accounts.views.profile_password'))
    else:
        form = forms.ProfilePasswordForm(request)

    context = {
        'form': form
    }
    return render_to_response('accounts/profile_password.html', context, context_instance=RequestContext(request))

@login_required
def profile_chats(request):
    if request.method == 'POST':
        form = forms.ProfileChatsForm(request, data=request.POST)
        if form.is_valid():
            form.save(commit=True)
            messages.success(request, "Save successful")
            return HttpResponseRedirect(reverse('accounts.views.profile_chats'))
    else:
        user_profile = request.user.get_profile()
        form_data = {
            'email_upcoming_chats':user_profile.email_upcoming_chats,
            'email_new_chat_topics':user_profile.email_new_chat_topics
        }
        form = forms.ProfileChatsForm(request, data=form_data)

    context = {
        'form': form
    }

    return render_to_response('accounts/profile_chats.html', context, context_instance=RequestContext(request))

@login_required
def profile_jobs(request):
    if request.method == 'POST':
        form = forms.ProfileJobsForm(request, data=request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Save successful")
            return HttpResponseRedirect(reverse('accounts.views.profile_jobs'))
    else:
        form = forms.ProfileJobsForm(request)

    # Create minimum salary values to populate the UI with
    # These values purposefully do not use the same values
    # that the form uses to validate min salary inputs.
    min_salary_options = range(
        50000,
        260000,
        10000)

    # Create data to populate the Positions field
    position_types = PositionType.objects.all()
    position_names = [p.name for p in position_types]
    json_position_types = [ {
        'id': p.id,
        'name': p.name,
        'description': p.description} for p in position_types]

    # Retrieve list of user's position preferences and create json data to populate UI
    position_prefs = PositionTypePref.objects.filter(user=request.user).select_related('position_type')
    json_position_prefs = [ {
        'id': pos.id,
        'positionTypeId': pos.position_type.id,
        'min_salary': pos.salary_start} for pos in position_prefs]

    # Retrieve list of user's future job technology preferences and create json data to populate UI
    technology_prefs = TechnologyPref.objects.filter(user=request.user).select_related('technology').order_by('technology__name')
    json_technology_prefs = [{
        'id': t.id,
        'technologyId': t.technology.id,
        'name': t.technology.name,
        'description': t.technology.description} for t in technology_prefs]

    # Retrieve list of user's future job location preferences and create json data to populate UI
    location_prefs = LocationPref.objects.filter(user=request.user).select_related('location').order_by('location__city')
    json_location_prefs = [{
        'id': l.id,
        'locationId': l.location.id,
        'city': l.location.city,
        'state': l.location.state,
        'zip': l.location.zip,
        'country': l.location.country} for l in location_prefs]

    # Retrieve list of user's notification preferences and create json data to populate UI
    try:
        notification_prefs = Prefs.objects.get(user=request.user)
        json_notification_prefs = {'emailNewJobOpps': notification_prefs.email_new_job_opps}
    except Prefs.DoesNotExist:
        json_notification_prefs = {'emailNewJobOpps': False}

    context = {
        'form': form,
        'json_notification_prefs': json.dumps(json_notification_prefs),
        'json_location_prefs' : json.dumps(json_location_prefs),
        'json_technology_prefs': json.dumps(json_technology_prefs),
        'json_user_positions': json.dumps(json_position_prefs),
        'json_position_types': json.dumps(json_position_types),
        'position_names': position_names,
        'min_salary_options': min_salary_options,
        'support_email': settings.DEFAULT_SUPPORT_EMAIL,
        'TR_XD_REMOTE': settings.TR_XD_REMOTE
    }

    return render_to_response('accounts/profile_jobs.html', context, context_instance=RequestContext(request))

@login_required
def profile_skills_languages(request):
    technology_type = 'Language'
    if request.method == 'POST':
        form = forms.ProfileSkillsForm(request, technology_type, data=request.POST)
        if form.is_valid():
            form.save(commit=True)
            messages.success(request, "Save successful")
            return HttpResponseRedirect(reverse('accounts.views.profile_skills_languages'))
        else:
            context = profile_skills_common(request, technology_type)
            context['form'] = form
    else:
        context = profile_skills_common(request, technology_type)
        context['form'] = forms.ProfileSkillsForm(request,technology_type)

    return render_to_response('accounts/profile_skills_languages.html', context, context_instance=RequestContext(request))

@login_required
def profile_skills_frameworks(request):
    technology_type = 'Framework'
    if request.method == 'POST':
        form = forms.ProfileSkillsForm(request, technology_type, data=request.POST)
        if form.is_valid():
            form.save(commit=True)
            messages.success(request, "Save successful")
            return HttpResponseRedirect(reverse('accounts.views.profile_skills_frameworks'))
        else:
            context = profile_skills_common(request, technology_type)
            context['form'] = form
    else:
        context = profile_skills_common(request, technology_type)
        context['form'] = forms.ProfileSkillsForm(request,technology_type)

    return render_to_response('accounts/profile_skills_frameworks.html', context, context_instance=RequestContext(request))

@login_required
def profile_skills_persistence(request):
    technology_type = 'Persistence'
    if request.method == 'POST':
        form = forms.ProfileSkillsForm(request, technology_type, data=request.POST)
        if form.is_valid():
            form.save(commit=True)
            messages.success(request, "Save successful")
            return HttpResponseRedirect(reverse('accounts.views.profile_skills_persistence'))
        else:
            context = profile_skills_common(request, technology_type)
            context['form'] = form
    else:
        context = profile_skills_common(request, technology_type)
        context['form'] = forms.ProfileSkillsForm(request,technology_type)

    return render_to_response('accounts/profile_skills_persistence.html', context, context_instance=RequestContext(request))


def profile_skills_common(request, technology_type_name):
    """ Pulled out the code that was common between the language_skills
        and framework_skill views.
    """

    # Populate list of supported skills for autocomplete widget
    skill_technology_type = TechnologyType.objects.get(name=technology_type_name)
    skill_technologies = Technology.objects.filter(type=skill_technology_type)
    json_autocomplete_skills = [s.name for s in skill_technologies]

    # Create expertise values to populate the UI with
    expertise_types = ExpertiseType.objects.all()
    expertise_options = [e.name for e in expertise_types]

    # Create years experience values to populate the UI with
    yrs_experience_options = range(0,21)

    # Retrieve list of user's language skills from db and create json data to populate UI
    user_skills = Skill.objects.filter(user=request.user, technology__type=skill_technology_type).select_related('technology').select_related('expertise_type')
    user_skills_list = [ {'name': skill.technology.name,
                          'expertise': skill.expertise_type.name,
                          'yrs_experience': skill.yrs_experience} for skill in user_skills]
    json_skills = []
    if user_skills_list:
        json_skills = user_skills_list

    context = {
        'expertise_options': expertise_options,
        'yrs_experience_options': yrs_experience_options,
        'json_autocomplete_skills': json.dumps(json_autocomplete_skills),
        'json_skills': json.dumps(json_skills),
        'support_email': settings.DEFAULT_SUPPORT_EMAIL,
        'TR_XD_REMOTE': settings.TR_XD_REMOTE
    }

    return context


