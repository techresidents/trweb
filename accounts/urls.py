from django.conf import settings
from django.conf.urls import patterns, url

urlpatterns = patterns('accounts.views',
    url(r'^login/$', 'login'),
    url(r'^login/otp/$', 'login_otp'),
    url(r'^logout/$', 'logout'),
    url(r'^request/$', 'account_request'),
    url(r'^register/activate/(?P<registration_code>\w+)$', 'register_activate'),
    url(r'^register/activate/$', 'register_activate'),
    url(r'^forgot_password/$', 'forgot_password'),
    url(r'^reset_password/(?P<reset_password_code>\w+)$', 'reset_password'),
    url(r'^otp/$', 'otp'),
    url(r'^profile/account/$', 'profile_account'),
    url(r'^profile/chats/$', 'profile_chats'),
    url(r'^profile/jobs/$', 'profile_jobs'),
    url(r'^profile/password/$', 'profile_password'),
    url(r'^profile/skills/languages/$', 'profile_skills_languages'),
    url(r'^profile/skills/frameworks/$', 'profile_skills_frameworks'),
    url(r'^profile/skills/persistence/$', 'profile_skills_persistence'),
)

if settings.REGISTRATION_REQUIRES_CODE:
    urlpatterns += patterns('accounts.views', url(r'^register/(?P<account_request_code>\w+)$', 'register'))
    urlpatterns += patterns('accounts.views', url(r'^e/register/(?P<account_request_code>\w+)$', 'register_employer'))
else:
    urlpatterns += patterns('accounts.views', url(r'^register/$', 'register'))
    urlpatterns += patterns('accounts.views', url(r'^e/register/$', 'register_employer'))
