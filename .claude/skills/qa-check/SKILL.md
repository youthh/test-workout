---
name: qa-check
description: Runs a QA agent to test the Iron Academy Next.js app after changes have been pushed to develop. Use this skill when the user says "qa", "протестуй", "перевір", "qa-check", "test the app", or after /push-feature succeeds and the user wants to verify everything works before releasing.
---

# QA Check — Iron Academy

You are running quality assurance on the Iron Academy Next.js app after changes to the `develop` branch.

## Steps

### 1. Start the dev server
```bash
PATH="/Users/emotion/.nvm/versions/node/v20.18.3/bin:$PATH" npx next dev /Users/emotion/Desktop/iron-academy --port 3002 2>&1 &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002
```

If the server doesn't return 200 — report the error and stop.

### 2. Check what changed recently
```bash
git -C /Users/emotion/Desktop/iron-academy log --oneline -5
git -C /Users/emotion/Desktop/iron-academy diff origin/main...develop --stat
```

Use this to understand what features were added and focus testing on those areas.

### 3. Run automated checks

**TypeScript types:**
```bash
PATH="/Users/emotion/.nvm/versions/node/v20.18.3/bin:$PATH" npx tsc --noEmit -p /Users/emotion/Desktop/iron-academy/tsconfig.json 2>&1
```

**Check all pages load:**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002
```

**Check no console errors in HTML:**
```bash
curl -s http://localhost:3002 | grep -i "error\|undefined\|null" | head -5
```

### 4. Manual test checklist

Test these flows on http://localhost:3002:

- [ ] Головна сторінка відкривається, всі 12 тем видно
- [ ] Натиснути на тему → quiz запускається
- [ ] Відповісти на питання → показує правильну/неправильну відповідь
- [ ] Кнопка "Наступне" → переходить до наступного питання
- [ ] Завершити тест → екран результатів
- [ ] "До тем" → повертає на головну
- [ ] Нові фічі (з останніх комітів) — перевір їх окремо

Report each item as ✅ або ❌.

### 5. Stop the server
```bash
pkill -f "next dev.*3002" 2>/dev/null
echo "server stopped"
```

### 6. Report results

**If all checks pass:**
- Підсумуй що перевірив і все пройшло
- Скажи: "✅ QA пройшов! Запусти `/release` щоб злити в main."

**If something fails:**
- Чітко опиши що саме не працює
- Вкажи в якому компоненті або файлі проблема
- Скажи що треба пофіксити перед релізом
