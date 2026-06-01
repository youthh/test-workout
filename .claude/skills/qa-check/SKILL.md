---
name: qa-check
description: Runs a QA agent to test the Iron Academy Next.js app after changes have been pushed to develop. Use this skill when the user says "qa", "протестуй", "перевір", "qa-check", "test the app", or after /push-feature succeeds and the user wants to verify everything works before releasing.
---

# QA Check — Iron Academy

You are running quality assurance on the Iron Academy Next.js app using the **live Vercel preview** of the `develop` branch.

```
DEV_URL=https://test-workout-git-develop-youthhs-projects.vercel.app
PROD_URL=https://test-workout.vercel.app
```

## Steps

### 1. Wait for develop deployment to be ready

After a push to develop, Vercel needs ~30-60 seconds to build.

```bash
for i in $(seq 1 10); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" https://test-workout-git-develop-youthhs-projects.vercel.app)
  echo "attempt $i: $CODE"
  [ "$CODE" = "200" ] && break
  sleep 15
done
```

If still not 200 after 10 attempts — check Vercel logs:
```bash
PATH="/Users/emotion/.nvm/versions/node/v20.18.3/bin:$PATH" vercel ls test-workout 2>&1 | head -10
```
Report the error and stop.

### 2. Check what changed vs production

```bash
git -C /Users/emotion/Desktop/iron-academy log origin/main..origin/develop --oneline
git -C /Users/emotion/Desktop/iron-academy diff origin/main...origin/develop --stat
```

Use this to understand what features were added — focus testing on those areas.

### 3. Run TypeScript check locally

```bash
PATH="/Users/emotion/.nvm/versions/node/v20.18.3/bin:$PATH" npx tsc --noEmit -p /Users/emotion/Desktop/iron-academy/tsconfig.json 2>&1
```

Zero errors = ✅. Any errors = fix before releasing.

### 4. Automated smoke tests on dev URL

```bash
DEV=https://test-workout-git-develop-youthhs-projects.vercel.app

# Homepage returns 200
curl -s -o /dev/null -w "homepage: %{http_code}\n" $DEV

# HTML contains expected content
curl -s $DEV | grep -c "Iron Academy" && echo "✅ title found" || echo "❌ title missing"
curl -s $DEV | grep -c "Тренажер\|Анатомія\|Глосарій" && echo "✅ sections found" || echo "❌ sections missing"

# No obvious JS errors in HTML
curl -s $DEV | grep -i "application error\|unhandled\|500" | head -3
```

### 5. Manual test checklist

Open https://test-workout-git-develop-youthhs-projects.vercel.app and test:

**Core flows:**
- [ ] Головна сторінка відкривається, всі 12 тем видно
- [ ] Натиснути на тему → quiz запускається
- [ ] Відповісти на питання (клавіші A/B/C/D теж працюють) → показує правильну/неправильну відповідь
- [ ] Enter/пробіл → переходить до наступного питання
- [ ] Завершити тест → екран результатів
- [ ] "До тем" → повертає на головну

**New features (from step 2 diff):**
- [ ] Перевір кожну нову фічу окремо

Report each item as ✅ або ❌.

### 6. Compare dev vs prod (regression check)

```bash
PROD_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://test-workout.vercel.app)
DEV_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://test-workout-git-develop-youthhs-projects.vercel.app)
echo "prod: $PROD_CODE | dev: $DEV_CODE"
```

Both should be 200.

### 7. Report results

**If all checks pass:**
- Підсумуй що перевірив і все пройшло
- Скажи: "✅ QA пройшов на dev URL! Запусти `/release` щоб злити в main і задеплоїти на прод."

**If something fails:**
- Чітко опиши що саме не працює
- Вкажи в якому компоненті або файлі проблема
- Скажи що треба пофіксити перед релізом
- НЕ дозволяй релізити поки є помилки
