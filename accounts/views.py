import forms
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

from techresidents_web.accounts.models import Skill
from techresidents_web.job.models import Prefs
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

@login_required
def profile_account(request):
    if request.method == "POST":
        form = forms.ProfileAccountForm(request, data=request.POST)
        if form.is_valid():
            form.save(commit=True)
            messages.success(request, 'Save successful')
            return HttpResponseRedirect(reverse("accounts.views.profile_account"))
    else:
        user = request.user
        user_profile = request.user.get_profile()
        if user_profile.developer_since is None:
            form_data = {
                'first_name':user.first_name,
                'last_name':user.last_name,
                'email_address':user.email
            }
        else:
            form_data = {
                'first_name':user.first_name,
                'last_name':user.last_name,
                'email_address':user.email,
                'developer_since':user_profile.developer_since.year
            }
        form = forms.ProfileAccountForm(request, data=form_data)

    context = {
        "form": form
    }

    return render_to_response('accounts/profile_account.html', context,  context_instance=RequestContext(request))

@login_required
def profile_password(request):
    if request.method == "POST":
        form = forms.ProfilePasswordForm(request, data=request.POST)
        if form.is_valid():
            form.save(commit=True)
            messages.success(request, 'Password successfully changed')
            return HttpResponseRedirect(reverse("accounts.views.profile_password"))
    else:
        form = forms.ProfilePasswordForm(request)

    context = {
        "form": form
    }
    return render_to_response('accounts/profile_password.html', context, context_instance=RequestContext(request))

@login_required
def profile_chats(request):
    if request.method == "POST":
        form = forms.ProfileChatsForm(request, data=request.POST)
        if form.is_valid():
            form.save(commit=True)
            messages.success(request, 'Save successful')
            return HttpResponseRedirect(reverse("accounts.views.profile_chats"))
    else:
        user_profile = request.user.get_profile()
        form_data = {
            'email_upcoming_chats':user_profile.email_upcoming_chats,
            'email_new_chat_topics':user_profile.email_new_chat_topics
        }
        form = forms.ProfileChatsForm(request, data=form_data)

    context = {
        "form": form
    }

    return render_to_response('accounts/profile_chats.html', context, context_instance=RequestContext(request))

@login_required
def profile_jobs(request):
    if request.method == "POST":
        form = forms.ProfileJobsForm(request, data=request.POST)
        if form.is_valid():
            form.save(commit=True)
            messages.success(request, 'Save successful')
            return HttpResponseRedirect(reverse("accounts.views.profile_jobs"))
    else:
        try:
            prefs = Prefs.objects.get(user=request.user)
            form_data = {
                'email_new_job_opps': prefs.email_new_job_opps,
                'salary_start': prefs.salary_start
            }
        except Prefs.DoesNotExist:
            form_data = {}

        form = forms.ProfileJobsForm(request, data=form_data)

    context = {
        "form": form
    }

    return render_to_response('accounts/profile_jobs.html', context, context_instance=RequestContext(request))

@login_required
def profile_skills_languages(request):
    # Populate list of supported languages for autocomplete widget
    language_technology_type = TechnologyType.objects.get(name='Language')
    languages = Technology.objects.filter(type=language_technology_type)
    language_names = [str(lang.name) for lang in languages]
    json_autocomplete_languages = json.dumps(language_names)

    if request.method == 'POST':
        form = forms.ProfileLanguageSkillsForm(request, data=request.POST)
        if form.is_valid():
            form.save(commit=True)
            messages.success(request, "Save successful")
            return HttpResponseRedirect(reverse('accounts.views.profile_skills_languages'))
    else:
        form = forms.ProfileLanguageSkillsForm(request)
        # Retrieve list of user's language skills
        language_skills = Skill.objects.filter(technology__type=language_technology_type).select_related('auth_user')
        skills_list = list(language_skills.values('technology', 'expertise_type', 'yrs_experience'))
        if skills_list:
            for skill in skills_list:

                # Lookup technology name
                technology_id = skill['technology']
                technology = Technology.objects.get(id=technology_id)
                skill[forms.ProfileLanguageSkillsForm.JSON_LANGUAGE_NAME] = str(technology.name)
                del skill['technology'] # no longer need this data

                # Lookup expertise type name
                expertise_id = skill['expertise_type']
                expertise = ExpertiseType.objects.get(id=expertise_id)
                skill[forms.ProfileLanguageSkillsForm.JSON_EXPERTISE] = str(expertise.name)
                del skill['expertise_type'] # no longer need this data

            json_language_skills = json.dumps(skills_list)
        else:
            # if user has no language skills specified, then create a list of defaults
            default_profile_languages = languages.filter(is_profile_default=True)
            default_language_skills = []
            for language in default_profile_languages:
                default_language = {
                    forms.ProfileLanguageSkillsForm.JSON_LANGUAGE_NAME:str(language.name),
                    forms.ProfileLanguageSkillsForm.JSON_EXPERTISE:'None',
                    forms.ProfileLanguageSkillsForm.JSON_YRS_EXPERIENCE:0
                }
                default_language_skills.append(default_language)
            json_language_skills = json.dumps(default_language_skills)

    context = {
        "form": form,
        "json_autocomplete_languages": json_autocomplete_languages,
        "json_language_skills": json_language_skills
    }

    return render_to_response('accounts/profile_skills_languages.html', context, context_instance=RequestContext(request))

def ptidemo(request):
    return render_to_response('accounts/ptiDemo.html',  context_instance=RequestContext(request))


    #TODO - temp
    #technology = models.Technology.objects.get(name="Django")
    #expertise_type = models.ExpertiseType.objects.get(name="Seasoned")
    #tmp = models.Skill.objects.filter(technology__name__iexact="Python", yrs_experience__gte=1).select_related("auth_user")
    #for skill in tmp:
    #    print skill.technology.name + ":" + str(skill.yrs_experience)
    #    print skill.user.get_profile().developer_since
    #user_skill = models.Skill(user=request.user, technology=technology, yrs_experience=2, expertise_type=expertise_type)
    #user_skill.save()