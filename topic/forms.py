import datetime
import pytz

from django import forms
from django.conf import settings
from django.utils import timezone

import OpenTokSDK

from common.forms import JSONField
from common.models import Topic
from techresidents_web.chat.models import Chat, ChatSession, ChatType


class TopicForm(forms.Form):
    topics = JSONField(max_length=8192, widget=forms.HiddenInput, required=True)

    def __init__(self, request, *args, **kwargs):
        self.request = request
        super(TopicForm, self).__init__(*args, **kwargs)

    def clean(self):
        super(TopicForm, self).clean()

        topics = self.cleaned_data.get("topics")

        # Ensure we have a root topic and at least one sub-topic
        if not topics or len(topics) < 2:
            raise forms.ValidationError("Invalid topic")

        # Ensure root title exists
        root = topics[0]
        if not root["title"]:
            raise forms.ValidationError("Topic title field required")

        # Ensure root title is unique.
        # This constraint exists to make versioning topics
        # easier to maintain over time, as the topic heirarchies
        # will surely change over time based upon user feedback.
        # This is especially important in the case where a user
        # completed v1 of a topic, but not v2.
        root_topic_titles = {}
        all_root_topics = Topic.objects.filter(rank=0).all()
        for root_topic in all_root_topics:
            root_topic_titles[root_topic.title] = root_topic
        if root["title"] in root_topic_titles:
            raise forms.ValidationError("Root topic title must be unique")

        # Construct map of topic IDs to topic data
        topic_map = { root["id"]: root }
        for topic in topics[1:]:

            parent_topic_id = topic["parentId"]
            parent_topic = topic_map[parent_topic_id]

            if not topic["title"]:
                raise forms.ValidationError("Topic title field required")

            if parent_topic_id not in topic_map:
                raise forms.ValidationError("Topic parents must preceed children in adjacency list")

            if topic["level"] - parent_topic["level"] != 1:
                raise forms.ValidationError("The level of topic children must be exactly one level greater than their parent")

            # Need to ensure that any topics that are between parent & child have a level > parent
            parent_topic_level = parent_topic["level"]
            parent_topic_rank = parent_topic["rank"]
            topic_rank = topic["rank"]
            num_topics_between_parent_and_child = topic_rank - parent_topic_rank
            if num_topics_between_parent_and_child > 1:
                for t in topic_map.values():
                    rank = t["rank"]
                    if rank > parent_topic_rank and rank < topic_rank:
                        # Topic is between parent and child
                        if not t["level"] > parent_topic_level:
                            raise forms.ValidationError("Invalid parent-child hierarchy")

            topic_map[topic["id"]] = topic

        return self.cleaned_data

    def save(self, commit=True):
        if self.errors:
            raise ValueError("Unable to save invalid topic")

        result = []
        topics = self.cleaned_data.get("topics")

        # Create root Topic
        root_topic = topics[0]
        root = Topic(
                id=root_topic["id"],
                title=root_topic["title"],
                description=root_topic["description"],
                duration=root_topic["duration"],
                recommended_participants=root_topic["recommendedParticipants"],
                rank=root_topic["rank"],
                type_id = 1,      #TODO fix topic type hard code
                user = self.request.user
                )
        topic_map = { root.id : root }
        result.append(root)

        # Create sub Topics
        for topic in topics[1:]:
            parent = topic_map[topic["parentId"]]
            model = Topic(
                    id=topic["id"],
                    title=topic["title"],
                    rank=topic["rank"],
                    description=topic["description"],
                    duration=topic["duration"],
                    recommended_participants=topic["recommendedParticipants"],
                    type_id = 1,
                    user = self.request.user
                    )
            model.parent = parent
            topic_map[model.id] = model
            result.append(model)
        
        if commit:
            Topic.objects.create_topic_tree(self.request.user, result)

        return result


class CreatePrivateChatForm(forms.Form):
    """ Form to create a private chat."""

    chat_time_radio_btns = forms.ChoiceField(
        widget=forms.RadioSelect(),
        choices=[[1, 'Start now'],
                 [0, 'Schedule for later']])

    chat_date = forms.DateField(
        label="Date",
        input_formats=('%m/%d/%Y',),
        required=False,
        widget=forms.DateInput(attrs={'placeholder': 'mm/dd/yyyy'}))

    chat_time = forms.TimeField(
        label="Time",
        input_formats=('%I:%M %p',),
        required=False,
        widget=forms.TimeInput(attrs={'placeholder': 'hh:mm am/pm'}))


    def __init__(self, request=None, topic_id=None, *args, **kwargs):
        super(CreatePrivateChatForm, self).__init__(*args, **kwargs)
        self.request = request
        self.topic_id = topic_id
        self.chat_starts_now = None   # Boolean indicating if user opted to start the chat right now
        self.chat_start_datetime = None  # This datetime obj is timezone aware


    def start_chat_now(self):
        """ If chat starts now, returns True; returns False otherwise."""
        return self.chat_starts_now


    def clean(self):
        """ Validate user provided chat date and time, if provided.

        If the chat is starting now, the chat date and time
        fields can be any value since they will be ignored.
        """

        # Set chat-start-time state based upon radio selection
        chat_time_radio = self.cleaned_data["chat_time_radio_btns"]
        if chat_time_radio == '1':
            self.chat_starts_now = True
        else:
            self.chat_starts_now = False

        is_start_time_valid = True
        if not self.chat_starts_now:
            chat_date = self.cleaned_data["chat_date"]
            chat_time = self.cleaned_data["chat_time"]
            if chat_date and chat_time:
                chat_start_no_tz = datetime.datetime.combine(chat_date, chat_time)
                self.chat_start_datetime = timezone.make_aware(chat_start_no_tz, timezone.get_current_timezone())
                if self.chat_start_datetime < timezone.now():
                    is_start_time_valid = False
            else:
                is_start_time_valid = False

        if not is_start_time_valid:
            raise forms.ValidationError("Chat date/time is invalid")

        return self.cleaned_data

    def save(self):
        """Save form data.

        Creates a Chat and ChatSession.
        """

        #Private chats allow access to chats
        #as long as the chat session id is known. The first
        #n users to access the chat session will be granted
        #access. Private chats require participants
        #to be site-registered.

        type = ChatType.objects.get(name='PRIVATE')
        topic = Topic.objects.get(id=self.topic_id)
        if self.chat_starts_now:
            chat_start = timezone.now()
        else:
            # Convert the user's specified date/time to UTC
            # so that this form always returns a UTC datetime
            # with chat.start
            chat_start_local_tz = self.chat_start_datetime
            chat_start = chat_start_local_tz.astimezone(pytz.UTC)

        #create chat
        chat = Chat.objects.create(
            type=type,
            topic=topic,
            start=chat_start,
            end=chat_start+datetime.timedelta(minutes=topic.duration),
            record=True)

        #Create the tokbox session
        opentok = OpenTokSDK.OpenTokSDK(
            settings.TOKBOX_API_KEY,
            settings.TOKBOX_API_SECRET)
        session = opentok.create_session(self.request.META['REMOTE_ADDR'])

        # Create the chat session
        chat_session = ChatSession.objects.create(chat=chat, token=session.session_id)

        return (chat, chat_session)