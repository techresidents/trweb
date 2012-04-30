from django import template

# To be a valid tag library, the module must contain a module-level variable named
# 'register' that is a template.Library instance, in which all the tags and filters are registered
register = template.Library()


@register.filter()
def widget_type(object):
    """ Returns a widget's type"""
    full_class_name = object.__class__.__module__ + "." + object.__class__.__name__
    return full_class_name
widget_type.is_safe = True