from django.conf import settings

def google_analytics(request):
    """Add the Google Analytics ID to the template context.
    Args:
        request: HttpRequest object
    Returns:
        Must return a dictionary
    """
    return {'GA_ID': settings.GA_ID}

def cross_domain_server(request):
    """Add the cross-domain server location to the template context.
    Args:
        request: HttpRequest object
    Returns:
        Must return a dictionary
    """
    return {'TR_XD_REMOTE': settings.TR_XD_REMOTE}
