from django.conf.urls import patterns, url

urlpatterns = patterns('talent.views',
    url(r'^$', 'talent'),
)
