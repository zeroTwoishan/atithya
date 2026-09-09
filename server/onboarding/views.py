from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from twilio.request_validator import RequestValidator

from .models import ConversationState

EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'


def _signature_valid(request) -> bool:
    """docs/TRD.md §6 NFR — webhook signature validation. Fails closed: with
    no Twilio auth token configured, every request is rejected rather than
    silently trusted — there's nothing to validate against, so there's
    nothing to accept. Configure TWILIO_AUTH_TOKEN (real, or Twilio's test
    credentials for local dev) before this endpoint will accept anything."""
    if not settings.TWILIO_AUTH_TOKEN:
        return False
    validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
    signature = request.headers.get("X-Twilio-Signature", "")
    url = request.build_absolute_uri()
    return validator.validate(url, request.POST.dict(), signature)


@csrf_exempt
@require_POST
def whatsapp_webhook(request):
    """docs/TRD.md §3.1 — Onboarding Agent trigger. Twilio WhatsApp Sandbox
    posts form-encoded fields: From, Body, NumMedia, MediaUrl0.. .

    TODO (hackathon day, R2): hand off to the LangGraph onboarding agent
    (classify_intent -> extract_fields -> ask_missing_or_confirm ->
    persist_listing) instead of just storing the raw message.
    """
    if not _signature_valid(request):
        return HttpResponse(status=403)

    whatsapp_number = request.POST.get("From", "")
    body = request.POST.get("Body", "")
    media_urls = [
        request.POST[key]
        for key in sorted(request.POST)
        if key.startswith("MediaUrl")
    ]

    conversation, _ = ConversationState.objects.get_or_create(whatsapp_number=whatsapp_number)
    history = conversation.state.get("messages", [])
    history.append({"body": body, "media_urls": media_urls})
    conversation.state["messages"] = history
    conversation.save()

    return HttpResponse(EMPTY_TWIML, content_type="text/xml")
