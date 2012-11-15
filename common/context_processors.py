from django.conf import settings

def tr_processors(request):
    """
    Define a function which will make the dictionary
    data available to all template contexts.

    Args:
        request: HttpRequest object
    Returns:
        Must return a dictionary.

        GA_ID: Add the Google Analytics ID to the template context.
        TR_XD_REMOTE: Add the cross-domain server location to the template context.
    """
    return {
        'GA_ID': settings.GA_ID,
        'TR_XD_REMOTE': settings.TR_XD_REMOTE
            }

