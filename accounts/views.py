import json

from django.core import serializers
from django.core.urlresolvers import reverse
from django.conf import settings
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.contrib.csrf.middleware import csrf_exempt
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.template.loader import get_template
from django.views.decorators.cache import never_cache
from django.contrib.auth.models import User

from techresidents_web.accounts import forms
from techresidents_web.accounts.models import Skill
from techresidents_web.job.models import Prefs, PositionType, PositionTypePref, TechnologyPref
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

            return HttpResponseRedirect(redirect_to)
    else:
        form = forms.LoginForm()
    
    context = {
            'form': form,
            'next': redirect_to,
            }

    return render_to_response('accounts/login.html', context,  context_instance=RequestContext(request))

def register(request):
    if request.method == 'POST':
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
            'user_form' : user_form,
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
            return HttpResponseRedirect(reverse('accounts.views.profile_account'))
    else:
        user = request.user
        user_profile = request.user.get_profile()
        form_data = {
            'first_name':user.first_name,
            'last_name':user.last_name,
            'email_address':user.email
        }
        if user_profile.developer_since is not None:
            form_data['developer_since'] = user_profile.developer_since.year
        form = forms.ProfileAccountForm(request, data=form_data)

    context = {
        'form': form
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
    min_salary_options = range(50000,260000,10000)

    # Create data to populate the Positions field autocomplete
    position_types = PositionType.objects.all()
    json_position_names = [p.name for p in position_types]
    json_position_types = [ {
        'id': p.id,
        'name': p.name,
        'description': p.description} for p in position_types]

    # Retrieve list of user's position preferences and create json data to populate UI
    position_prefs = PositionTypePref.objects.filter(user=request.user).select_related('position_type')
    json_user_position_prefs = [ {
        'id': pos.id,
        'positionTypeId': pos.position_type.id,
        'min_salary': pos.salary_start} for pos in position_prefs]

    # Retrieve list of user's future job technology preferences and create json data to populate UI
    technology_prefs = TechnologyPref.objects.filter(user=request.user).select_related('technology').order_by('technology__name')
    json_technology_prefs = [{
        'technologyId': t.technology.id,
        'name': t.technology.name,
        'description': t.technology.description} for t in technology_prefs]

    context = {
        'form': form,
        'json_technology_prefs': json.dumps(json_technology_prefs),
        'json_user_positions': json.dumps(json_user_position_prefs),
        'json_autocomplete_positions': json.dumps(json_position_names),
        'json_position_types': json.dumps(json_position_types),
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
    user_skills = Skill.objects.filter(technology__type=skill_technology_type).select_related('technology').select_related('expertise_type')
    user_skills_list = [ {'name': skill.technology.name,
                          'expertise': skill.expertise_type.name,
                          'yrs_experience': skill.yrs_experience} for skill in user_skills]
    json_skills = []
    if user_skills_list:
        json_skills = user_skills_list
    else:
        # if user has no skills specified, then create a list of defaults
        default_profile_technologies = skill_technologies.filter(is_profile_default=True)
        default_skills = []
        for technology in default_profile_technologies:
            default_skill = {
                'name':str(technology.name),
                'expertise':'None',
                'yrs_experience':0
            }
            default_skills.append(default_skill)
        json_skills = default_skills

    context = {
        'expertise_options': expertise_options,
        'yrs_experience_options': yrs_experience_options,
        'json_autocomplete_skills': json.dumps(json_autocomplete_skills),
        'json_skills': json.dumps(json_skills),
        'support_email': settings.DEFAULT_SUPPORT_EMAIL
    }

    return context


