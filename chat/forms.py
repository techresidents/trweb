from django import forms
from django.contrib.auth.models import User
from django.utils import timezone

from techresidents_web.common.models import Quality
from techresidents_web.chat.models import ChatFeedback, ChatSession


class CreateChatForm(forms.Form):
    username = forms.EmailField(label="Email", max_length=30, required=True)

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        super(CreateChatForm, self).__init__(*args, **kwargs)

    def clean_username(self):
        username = self.cleaned_data["username"]
        try:
            User.objects.get(username=username)
            if self.request.user.username == username:
                raise forms.ValidationError("Cannot chat with yourself.")
            return username
        except User.DoesNotExist:
            raise forms.ValidationError("Username does not exist.")

class ChatFeedbackForm(forms.Form):

    QUALITY_CHOICES = (
        ("EXCELLENT", "Excellent"),
        ("GOOD", "Good"),
        ("AVERAGE", "Average"),
        ("FAIR", "Fair"),
        ("POOR", "Poor"),
    )

    overall_quality = forms.ChoiceField(choices=QUALITY_CHOICES)
    technical_quality = forms.ChoiceField(choices=QUALITY_CHOICES)

    def __init__(self, request=None, chat_session_id=None, *args, **kwargs):
        self.request = request
        self.chat_session_id = chat_session_id

        super(ChatFeedbackForm, self).__init__(*args, **kwargs)
    
    def clean(self):
        try:
            ChatSession.objects.select_related("chat").get(
                    id=self.chat_session_id,
                    users=self.request.user,
                    chat__start__lte=timezone.now())

            if ChatFeedback.objects.filter(
                    user_id=self.request.user.id,
                    chat_session_id=self.chat_session_id).exists():
                raise forms.ValidationError("Chat feedback already exists")

            return self.cleaned_data

        except ChatSession.DoesNotExist:
            raise forms.ValidationError("Chat session invalid")

    def save(self, commit=True):
        #Map quality names to models
        quality_map = {}
        for quality in  Quality.objects.all():
            quality_map[quality.name] = quality
        
        overall_quality = quality_map[self.cleaned_data["overall_quality"]]
        technical_quality = quality_map[self.cleaned_data["technical_quality"]]

        feedback = ChatFeedback(
                chat_session_id=self.chat_session_id,
                user_id=self.request.user.id,
                overall_quality=overall_quality,
                technical_quality=technical_quality)
        
        if(commit):
            feedback.save()
        
        return feedback



