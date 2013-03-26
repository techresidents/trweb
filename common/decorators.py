from django.contrib.auth.decorators import user_passes_test
from django.contrib.auth import REDIRECT_FIELD_NAME

def staff_required(function, redirect_field_name=REDIRECT_FIELD_NAME):
    def check_is_staff(user):
        ret = False
        if user.is_authenticated() and user.is_staff:
            ret = True
        return ret
    wrapper = user_passes_test(
            check_is_staff,
            redirect_field_name=redirect_field_name)
    return wrapper(function)

def employer_required(function, redirect_field_name=REDIRECT_FIELD_NAME):
    def check_is_employer(user):
        ret = False
        if user.is_authenticated() and user.is_employer:
            ret = True
        return ret
    wrapper = user_passes_test(
        check_is_employer,
        redirect_field_name=redirect_field_name)
    return wrapper(function)

def developer_required(function, redirect_field_name=REDIRECT_FIELD_NAME):
    def check_is_developer(user):
        ret = False
        if user.is_authenticated() and user.is_developer:
            ret = True
        return ret
    wrapper = user_passes_test(
            check_is_developer,
            redirect_field_name=redirect_field_name)
    return wrapper(function)
