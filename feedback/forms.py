
from django import forms
from django.conf import settings
from django.core.mail import send_mail


MESSAGE_MAX_LEN = 1024

FEEDBACK_TYPE_CHOICES = [
    ("General", "General"),
    ("RFE", "Feature Request/Enhancement"),
    ("BUG", "Bug Report"),
    ("Chat Topic Request", "Chat Topic Request")
    ]


class FeedbackForm(forms.Form):

    type = forms.ChoiceField(
        label="Category",
        choices=FEEDBACK_TYPE_CHOICES,
        widget=forms.widgets.Select(attrs={'class':'span4'}),
        required=True)

    message = forms.CharField(
        label="Message",
        max_length=MESSAGE_MAX_LEN,
        widget=forms.widgets.Textarea(attrs={
            'class':'span6',
            'placeholder': 'What"s on your mind?'}),
        required=True)

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        super(FeedbackForm, self).__init__(*args, **kwargs)

    def send(self):
        """ Send form data to Tech Residents feedback account
        via email.
        """
        # Get user's feedback data
        user = self.request.user
        type = self.cleaned_data['type']
        message = self.cleaned_data['message']
        message += '\n\n<<< from user: email=%s, name=%s >>>' % (user.email, user.first_name)

        # Will send this info to TR Feedback acct for processing
        send_mail(
            subject=type,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.DEFAULT_FEEDBACK_EMAIL],
            fail_silently=True
        )