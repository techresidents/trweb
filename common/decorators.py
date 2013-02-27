from django.contrib.auth.decorators import user_passes_test
from django.contrib.auth import REDIRECT_FIELD_NAME

def staff_required(function, redirect_field_name=REDIRECT_FIELD_NAME):
    wrapper = user_passes_test(
            lambda u: u.is_staff,
            redirect_field_name=redirect_field_name)
    return wrapper(function)

def employer_required(function, redirect_field_name=REDIRECT_FIELD_NAME):
    wrapper = user_passes_test(
            lambda u: u.is_employer,
            redirect_field_name=redirect_field_name)
    return wrapper(function)

def developer_required(function, redirect_field_name=REDIRECT_FIELD_NAME):
    wrapper = user_passes_test(
            lambda u: u.is_developer,
            redirect_field_name=redirect_field_name)
    return wrapper(function)
