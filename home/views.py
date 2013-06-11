from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect

from techresidents_web.common.decorators import developer_required, employer_required


@login_required
def home(request):
    if request.user.is_employer:
        return home_employer(request)
    else:
        return home_developer(request)

@developer_required
def home_developer(request):
    """Developer home"""
    relative_link = reverse("developer.views.developer")
    absolute_link = request.build_absolute_uri(relative_link+"home")
    return HttpResponseRedirect(absolute_link)

@employer_required
def home_employer(request):
    """Employer home"""
    relative_link = reverse("employer.views.employer")
    absolute_link = request.build_absolute_uri(relative_link+"home")
    return HttpResponseRedirect(absolute_link)
