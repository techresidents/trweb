from django.conf.urls import patterns, url

urlpatterns = patterns('employer.views',
    url(r'^$', 'employer'),
)
