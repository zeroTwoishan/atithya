import uuid

from django.conf import settings
from django.db import models


class ConversationState(models.Model):
    """docs/BACKEND_SCHEMA.md §3 `conversation_state` — per-WhatsApp-number onboarding
    conversation memory (docs/TRD.md §3.1). `state` is JSONB, not fixed columns,
    because the conversation shape changes agent-side without a migration."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    whatsapp_number = models.CharField(max_length=32, unique=True)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    state = models.JSONField(default=dict, blank=True)
    last_message_at = models.DateTimeField(auto_now=True)
