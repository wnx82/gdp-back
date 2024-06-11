import git
from datetime import datetime, timedelta

repo = git.Repo('/root/personal-projects/gdp-back')


commits = list(repo.iter_commits('main'))  # Assurez-vous que la branche principale est correcte

commit_times = [datetime.fromtimestamp(commit.committed_date) for commit in commits]
commit_times.sort()

# Initialisation d'un dictionnaire pour stocker les jours travaillés
work_days = set()

for commit_time in commit_times:
    day = commit_time.date()
    work_days.add(day)

# Estimation du nombre d'heures par jour (par exemple, 4 heures par jour de travail)
average_hours_per_day = 4
total_days = len(work_days)
total_hours = total_days * average_hours_per_day

print(f"Total days worked: {total_days}")
print(f"Total hours spent: {total_hours:.2f}")