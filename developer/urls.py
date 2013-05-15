from django.conf.urls import patterns, url

urlpatterns = patterns('developer.views',
    url(r'^$', 'developer'),
)
