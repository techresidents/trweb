from django.conf.urls.defaults import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.generic.simple import redirect_to

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'thirty_web.views.home', name='home'),
    # url(r'^thirty_web/', include('thirty_web.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
    
    url(r'^$', redirect_to, {'url': 'accounts/login/'}),
    url(r'^accounts/', include('accounts.urls')),
    url(r'^chat/', include('chat.urls')),

)

#This is for development purposes only.
#It will only work if DEBUG is set to true.
urlpatterns += staticfiles_urlpatterns()
