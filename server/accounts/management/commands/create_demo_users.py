from django.core.management.base import BaseCommand

from accounts.models import User

DEMO_USERS = [
    {"username": "tourist_demo", "role": User.Role.TOURIST, "language": "en"},
    {"username": "host_demo", "role": User.Role.HOST, "language": "hi"},
    {"username": "gov_demo", "role": User.Role.GOV, "language": "en"},
]


class Command(BaseCommand):
    """docs/TRD.md §4 — the 3 fixed demo role accounts JWTs are issued to.

    Usage: manage.py create_demo_users
    """

    help = "Create the 3 fixed demo accounts (tourist_demo/host_demo/gov_demo)"

    def handle(self, *args, **options):
        for data in DEMO_USERS:
            user, created = User.objects.get_or_create(username=data["username"], defaults=data)
            if created:
                user.set_password(data["username"])  # demo-only: password == username
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created {user.username}"))
            else:
                self.stdout.write(f"{user.username} already exists")
