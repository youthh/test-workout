---
name: release
description: Creates a Pull Request from develop to main and merges it to release the Iron Academy app to production. Use this skill when the user says "release", "реліз", "злити в main", "merge to main", "відправити в прод", "ship it", or after /qa-check passes and the user is ready to deploy. Always ensure /push-feature and /qa-check have run successfully before releasing.
---

# Release — Merge develop → main

You are releasing the Iron Academy app to production by merging `develop` into `main`.

## Pre-flight check

First confirm with the user:
"Впевнений що хочеш злити develop в main? Це задеплоїть зміни на продакшн (Vercel автоматично задеплоїть після мержу)."

If they confirm — proceed.

## Steps

### 1. Check develop is ahead of main
```bash
git -C /Users/emotion/Desktop/iron-academy fetch origin 2>&1
git -C /Users/emotion/Desktop/iron-academy log origin/main..origin/develop --oneline 2>&1
```

Show the user which commits will go in release. If develop has 0 commits ahead of main — скажи "Нічого нового для релізу" і зупинись.

### 2. Create Pull Request
```bash
gh pr create \
  --repo youthh/test-workout \
  --base main \
  --head develop \
  --title "$(git -C /Users/emotion/Desktop/iron-academy log origin/main..origin/develop --oneline | head -1 | sed 's/^[a-f0-9]* //')" \
  --body "$(cat <<'EOF'
## Зміни
$(git -C /Users/emotion/Desktop/iron-academy log origin/main..origin/develop --oneline)

## QA
- [x] Білд проходить
- [x] QA перевірено

🤖 Released via /release skill
EOF
)" 2>&1
```

### 3. Merge the PR
```bash
gh pr merge --repo youthh/test-workout --squash --delete-branch=false 2>&1
```

Використовуємо `--squash` щоб зберегти чистий main. Гілка `develop` не видаляється — вона потрібна для наступних фіч.

### 4. Pull latest main locally
```bash
git -C /Users/emotion/Desktop/iron-academy -c credential.helper="!gh auth git-credential" fetch origin 2>&1
git -C /Users/emotion/Desktop/iron-academy -c credential.helper="!gh auth git-credential" pull origin main 2>&1
```

### 5. Report

Повідом:
- ✅ PR створено і змержено в main
- 🚀 Vercel автоматично задеплоїть за ~1-2 хвилини
- Посилання на PR: (з виводу gh pr create)
- Посилання на сайт: https://test-workout.vercel.app

### Якщо щось пішло не так

- **PR вже існує** — знайди його через `gh pr list --repo youthh/test-workout` і змержи вручну
- **Merge conflict** — скажи користувачу що є конфлікти і треба вирішити їх в develop перед релізом
- **gh auth error** — запропонуй виконати `gh auth login`
