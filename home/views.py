
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.shortcuts import render_to_response
from django.template import RequestContext


from trpycore.encode.basic import basic_encode, basic_decode
from techresidents_web.accounts.models import Skill
from techresidents_web.common.models import TechnologyType, Topic
from techresidents_web.chat.models import Chat, ChatSession, ChatUser
from techresidents_web.job.models import PositionTypePref, TechnologyPref, LocationPref



class BaseUserAction(object):
    """Base user action class.

    This class is used to encapsulate
    all the data that is required to
    display a recommended action to
    the user.
    """
    def __init__(self, category=None, link=None):
        self.category = category
        self.link = link

class ChatUserAction(BaseUserAction):
    """ Chat user action.

    This class encapsulates all the data
    that is required to display a recommended
    action for the user to participate in a
    chat.
    """
    def __init__(self, chat_name=None, link=None):
        super(ChatUserAction, self).__init__(category="chat", link=link)
        self.chat_name = chat_name


@login_required
def compute_recommended_actions(request, profile_completion_percentage, completed_topics_list):
    """Helper function to compute recommended
    next actions for the users.

    Returns a list of UserAction objects.
    """
    user_actions = []

    # Have user add info to their profile
    # if it's not 100% complete
    if profile_completion_percentage != 100:
        relative_link = reverse("accounts.views.profile_account")
        absolute_link = request.build_absolute_uri(relative_link)
        action = BaseUserAction(category='profile', link=absolute_link)
        user_actions.append(action)

    tutorial_completed = False
    bio_completed = False
    for topic in completed_topics_list:
        if topic.title == 'Tutorial':   #TODO how best to search for these topics?
            tutorial_completed = True
        elif topic.title == '1 minute bio': #TODO
            bio_completed = True

    # Only recommend one of these chats to complete,
    # not both.
    if not tutorial_completed:
        tutorial_topic = Topic.objects.get(title="Tutorial")
        relative_link = reverse("topic.views.details", args=[basic_encode(tutorial_topic.id)])
        absolute_link = request.build_absolute_uri(relative_link)
        action = ChatUserAction(chat_name=tutorial_topic.title, link=absolute_link)
        user_actions.append(action)
    elif not bio_completed:
        bio_topic = Topic.objects.get(title="1 minute bio")
        relative_link = reverse("topic.views.details", args=[basic_encode(bio_topic.id)])
        absolute_link = request.build_absolute_uri(relative_link)
        action = ChatUserAction(chat_name=bio_topic.title, link=absolute_link)
        user_actions.append(action)

    return user_actions

@login_required
def compute_profile_completion(request):
    """ Helper function to compute what percentage
     of a user's profile has been completed.
    """
    profile_percent_complete = 0

    # 10% for basic user profile info
    user_profile = request.user.get_profile()
    if user_profile.developer_since is not None:
        profile_percent_complete += 10

    # 15% for each skill
    skill_types = ['Language', 'Framework', 'Persistence']
    for name in skill_types:
        user_skills_count = Skill.objects.filter(user=request.user, technology__type__name=name).count()
        if user_skills_count > 0:
            profile_percent_complete += 15

    #15% for each job preference
    position_prefs_count = PositionTypePref.objects.filter(user=request.user).count()
    if position_prefs_count > 0:
        profile_percent_complete += 15
    technology_prefs_count = TechnologyPref.objects.filter(user=request.user).count()
    if technology_prefs_count > 0:
        profile_percent_complete += 15
    location_prefs_count = LocationPref.objects.filter(user=request.user).count()
    if location_prefs_count > 0:
        profile_percent_complete += 15

    return profile_percent_complete

@login_required
def home(request):
    """ List all chat topics"""

    # Retrieve all topics user chatted about
    completed_topics = Topic.objects.\
        filter(chats__chat_sessions__users=request.user).\
        order_by("title").\
        distinct("title")

    topic_contexts = []
    for topic in completed_topics:
        topic_contexts.append({
            "encoded_topic_id": basic_encode(topic.id),
            "topic": topic,
            "completed": True
        })

    # Retrieve all root topics
    chat_topics = Topic.objects.\
        filter(rank=0).\
        order_by("title")

    for topic in chat_topics:
        if topic not in completed_topics:
            topic_contexts.append({
                "encoded_topic_id": basic_encode(topic.id),
                "topic": topic,
                "completed": False
            })

    profile_completion_percentage = compute_profile_completion(request)
    recommended_actions = compute_recommended_actions(request, profile_completion_percentage, completed_topics)

    context = {
        "chat_topics": topic_contexts,
        "full_name": request.user.get_full_name(),
        "profile_completed": profile_completion_percentage,
        "recommended_actions": recommended_actions
    }

    return render_to_response('home/home.html', context, context_instance=RequestContext(request))
