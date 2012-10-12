
from django.contrib.auth.decorators import login_required
from django.shortcuts import render_to_response
from django.template import RequestContext


from trpycore.encode.basic import basic_encode, basic_decode
from techresidents_web.accounts.models import Skill
from techresidents_web.common.models import TechnologyType, Topic
from techresidents_web.chat.models import Chat, ChatSession, ChatUser
from techresidents_web.job.models import PositionTypePref, TechnologyPref, LocationPref


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
        technology_type_name = name
        skill_technology_type = TechnologyType.objects.get(name=technology_type_name)
        user_skills = Skill.objects.filter(user=request.user, technology__type=skill_technology_type).select_related('technology')
        if len(user_skills) > 0:
            profile_percent_complete += 15

    #15% for each job preference
    position_prefs = PositionTypePref.objects.filter(user=request.user)
    if len(position_prefs) > 0:
        profile_percent_complete += 15
    technology_prefs = TechnologyPref.objects.filter(user=request.user)
    if len(technology_prefs) > 0:
        profile_percent_complete += 15
    location_prefs = LocationPref.objects.filter(user=request.user)
    if len(location_prefs) > 0:
        profile_percent_complete += 15

    return profile_percent_complete

@login_required
def home(request):
    """ List all chat topics"""

    # Retrieve all topics user chatted about
    chat_sessions = ChatSession.objects.\
    filter(users=request.user).\
    select_related("chat", "chat__topic").\
    order_by("chat__topic__title").\
    distinct("chat__topic__title")

    completed_topics = []
    for chat_session in chat_sessions:
        completed_topics.append(chat_session.chat.topic)

    # Retrieve all root topics
    chat_topics = Topic.objects.\
    filter(rank=0).\
    order_by("title")

    incomplete_topics = []
    for topic in chat_topics:
        if topic not in completed_topics:
            incomplete_topics.append(topic)

    topic_contexts = []
    for topic in completed_topics:
        topic_contexts.append({
            "encoded_topic_id": basic_encode(topic.id),
            "topic": topic,
            "completed": True
        })
    for topic in incomplete_topics:
        topic_contexts.append({
            "encoded_topic_id": basic_encode(topic.id),
            "topic": topic,
            "completed": False
        })

    context = {
        "chat_topics": topic_contexts,
        "full_name": request.user.get_full_name(),
        "profile_completed": compute_profile_completion(request),
        "recommended_actions": 'accounts.views.login_otp'
    }

    return render_to_response('chat/home.html', context, context_instance=RequestContext(request))
