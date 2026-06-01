---
name: hotfix
description: Applies a critical fix directly to the main branch and deploys to production immediately, bypassing the develop → PR → merge flow. Use ONLY when the user says "hotfix", "критичний баг", "прод впав", "терміново", "fix prod", "emergency", або коли щось зламано на продакшні прямо зараз. For normal features always use /push-feature + /release instead.
---

# Hotfix — Critical Production Fix

⚠️ Цей скіл пушить напряму в `main`. Використовуй тільки для критичних багів на проді.

## Pre-flight check

Перед тим як починати, переконайся:
```bash
git -C /Users/emotion/Desktop/iron-academy status
git -C /Users/emotion/Desktop/iron-academy diff --stat HEAD
```

Покажи користувачу що буде змінено. Якщо зміни стосуються більше 3 файлів або виглядають як фіча а не баг — зупинись і скажи: "Це схоже на фічу, а не hotfix. Використай `/push-feature` + `/release`."

## Steps

### 1. Verify prod is actually broken
```bash
curl -s -o /dev/null -w "%{http_code}" https://test-workout.vercel.app
```
Якщо 200 — запитай користувача що саме зламано, щоб зрозуміти критичність.

### 2. Run TypeScript check
```bash
PATH="/Users/emotion/.nvm/versions/node/v20.18.3/bin:$PATH" npx tsc --noEmit -p /Users/emotion/Desktop/iron-academy/tsconfig.json 2>&1
```
Якщо є TypeScript помилки — зупинись і покажи їх. Не деплой зламаний код.

### 3. Commit directly to main

Спочатку переключись на main і стягни останні зміни:
```bash
git -C /Users/emotion/Desktop/iron-academy -c credential.helper="!gh auth git-credential" fetch origin
git -C /Users/emotion/Desktop/iron-academy checkout main
git -C /Users/emotion/Desktop/iron-academy pull origin main
```

Зроби коміт:
```bash
git -C /Users/emotion/Desktop/iron-academy add -A
git -C /Users/emotion/Desktop/iron-academy commit -m "hotfix: <опис проблеми>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### 4. Push to main
```bash
git -C /Users/emotion/Desktop/iron-academy -c credential.helper="!gh auth git-credential" push origin main 2>&1
```

### 5. Deploy immediately
```bash
PATH="/Users/emotion/.nvm/versions/node/v20.18.3/bin:$PATH" vercel deploy --prod 2>&1 | tail -15
```

### 6. Sync hotfix back to develop
Важливо — інакше develop відстане від main:
```bash
git -C /Users/emotion/Desktop/iron-academy checkout develop
git -C /Users/emotion/Desktop/iron-academy -c credential.helper="!gh auth git-credential" pull origin develop
git -C /Users/emotion/Desktop/iron-academy merge main --no-edit
git -C /Users/emotion/Desktop/iron-academy -c credential.helper="!gh auth git-credential" push origin develop 2>&1
```

### 7. Verify fix
```bash
curl -s -o /dev/null -w "%{http_code}" https://test-workout.vercel.app
```

### 8. Report
```
✅ Hotfix задеплоєно на прод
🔗 https://test-workout.vercel.app
📝 Коміт: <hash>
🔄 develop синхронізовано з main
```

### Якщо щось пішло не так

**Push відхилено** → `git -C /Users/emotion/Desktop/iron-academy pull origin main --rebase` потім push знову

**Білд впав на Vercel** → перевір TypeScript помилки, відкоти через `/rollback` якщо є такий скіл
