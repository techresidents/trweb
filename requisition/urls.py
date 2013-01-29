from django.conf.urls import patterns, url

urlpatterns = patterns('requisition.views',
    url(r'^$', 'requisition'),
)
