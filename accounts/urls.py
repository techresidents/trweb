from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('accounts.views',
    url(r'^login/$', 'login'),
    url(r'^logout/$', 'logout'),
    url(r'^register/$', 'register'),
    url(r'^register/activate/(?P<registration_code>\w+)$', 'register_activate'),
    url(r'^forgot_password/$', 'forgot_password'),
    url(r'^reset_password/(?P<reset_password_code>\w+)$', 'reset_password'),
    url(r'^profile/account/$', 'profile_account'),
    url(r'^profile/chats/$', 'profile_chats'),
    url(r'^profile/jobs/$', 'profile_jobs'),
    url(r'^profile/password/$', 'profile_password'),
    url(r'^profile/skills/languages$', 'profile_skills_languages'),
    url(r'^profile/skills/frameworks$', 'profile_skills_frameworks'),
)
