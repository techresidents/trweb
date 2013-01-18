from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MaxLengthValidator

def patch_username_length(max_length):
    username = User._meta.get_field("username")
    username.max_length = max_length
    for validator in username.validators:
        if isinstance(validator, MaxLengthValidator):
            validator.limit_value = max_length

#patch_username_length(75)
