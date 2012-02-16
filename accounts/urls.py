from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('accounts.views',
    url(r'^login/$', 'login'),
    url(r'^logout/$', 'logout'),
    url(r'^register/$', 'register'),
    url(r'^profile/$', 'profile'),
)
