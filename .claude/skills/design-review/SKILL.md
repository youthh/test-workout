---
name: design-review
description: Audits the Iron Academy UI for design and accessibility issues — contrast, font sizes, touch targets, missing ARIA labels, mobile spacing, and CSS consistency. Use when the user says "design review", "перевір дизайн", "accessibility", "доступність", "мобілка", "контраст", "UI аудит", or wants to improve visual quality before a release.
---

# Design Review — Iron Academy

Аудит UI якості: доступність, контраст, мобільний UX, консистентність.

## Steps

### 1. Fetch live HTML
```bash
HTML=$(curl -s https://test-workout-git-develop-youthhs-projects.vercel.app)
echo "$HTML" | wc -c
```
Якщо < 1000 символів — сайт не відповідає, зупинись.

### 2. Accessibility checks
```bash
echo "$HTML" | python3 -c "
import sys, re
html = sys.stdin.read()

issues = []

# Images without alt
imgs = re.findall(r'<img[^>]*>', html, re.I)
no_alt = [i for i in imgs if 'alt=' not in i.lower()]
if no_alt: issues.append(f'❌ {len(no_alt)} зображень без alt тегу')
else: print('✅ Всі зображення мають alt')

# Buttons without accessible text
btns = re.findall(r'<button[^>]*>(.*?)</button>', html, re.I | re.S)
empty_btns = [b for b in btns if not re.sub(r'<[^>]+>', '', b).strip()]
if empty_btns: issues.append(f'❌ {len(empty_btns)} кнопок без тексту (потрібен aria-label)')
else: print('✅ Всі кнопки мають текст')

# Lang attribute
if 'lang=' in html: print('✅ html lang атрибут є')
else: issues.append('❌ Відсутній lang атрибут на <html>')

# Meta viewport
if 'viewport' in html: print('✅ Meta viewport є')
else: issues.append('❌ Відсутній meta viewport')

# Meta description
if 'name=\"description\"' in html or \"name='description'\" in html:
    print('✅ Meta description є')
else: issues.append('⚠️  Немає meta description')

for i in issues: print(i)
"
```

### 3. CSS design audit (local files)
```bash
python3 -c "
import re

with open('/Users/emotion/Desktop/iron-academy/app/globals.css') as f:
    css = f.read()

issues = []
ok = []

# Small font sizes
small_fonts = re.findall(r'font-size:\s*([0-9]+)px', css)
tiny = [s for s in small_fonts if int(s) < 11]
if tiny: issues.append(f'⚠️  font-size менше 11px: {set(tiny)}px (важко читати)')
else: ok.append('✅ Розміри шрифтів в нормі (≥11px)')

# Hardcoded colors (not CSS vars)
hardcoded = re.findall(r'(?:color|background)[^:]*:\s*(#[0-9a-fA-F]{3,6}|rgb\([^)]+\))', css)
non_var = [c for c in hardcoded if not c.startswith('var(')]
if len(non_var) > 5:
    issues.append(f'⚠️  {len(non_var)} хардкодованих кольорів (не CSS змінні) — ускладнюють тему')
else: ok.append(f'✅ Кольори через CSS змінні ({len(non_var)} хардкодованих)')

# Touch targets — buttons < 36px
small_btns = re.findall(r'(?:height|min-height|padding):\s*([0-9]+)px', css)
very_small = [s for s in small_btns if int(s) < 30]
if very_small: issues.append(f'⚠️  Є елементи < 30px (можуть бути важкі для натискання на мобілці)')
else: ok.append('✅ Розміри елементів підходять для touch')

# Check light theme completeness
light_vars = re.findall(r'\[data-theme=\"light\"\]\s*{([^}]+)}', css, re.S)
dark_vars = re.findall(r':root\s*{([^}]+)}', css, re.S)
if light_vars and dark_vars:
    dark_count = len(re.findall(r'--[a-z]', dark_vars[0]))
    light_count = len(re.findall(r'--[a-z]', light_vars[0]))
    if light_count < dark_count:
        issues.append(f'⚠️  Світла тема перевизначає {light_count}/{dark_count} CSS змінних — деякі можуть не перемикатись')
    else: ok.append('✅ Світла тема покриває всі CSS змінні')

for i in ok: print(i)
for i in issues: print(i)
"
```

### 4. Mobile UX checks (components)
```bash
python3 -c "
import os, re, glob

component_dir = '/Users/emotion/Desktop/iron-academy/components'
files = glob.glob(f'{component_dir}/*.tsx')

issues = []
ok = []

for fpath in files:
    with open(fpath) as f:
        content = f.read()
    name = os.path.basename(fpath)

    # onClick without onKeyDown (keyboard accessibility)
    on_clicks = len(re.findall(r'onClick=', content))
    on_keys = len(re.findall(r'onKey(Down|Press|Up)=', content))
    divs_with_click = len(re.findall(r'<div[^>]*onClick=', content))
    if divs_with_click > 0:
        issues.append(f'⚠️  {name}: {divs_with_click} <div> з onClick без role/onKeyDown')

# Global keyboard shortcuts exist?
quiz = '/Users/emotion/Desktop/iron-academy/components/QuizScreen.tsx'
with open(quiz) as f:
    q = f.read()
if 'keydown' in q: ok.append('✅ Keyboard shortcuts в QuizScreen')

# Check for aria-label on icon buttons
all_tsx = ' '.join(open(f).read() for f in files)
icon_btns = re.findall(r'<button[^>]*>([\s]*[🏆🧠📊📖🫀🎯🃏📝🏅]{1}[\s]*)<\/button>', all_tsx)
if icon_btns: issues.append(f'⚠️  {len(icon_btns)} кнопок тільки з емодзі — потрібен title або aria-label')

for i in ok: print(i)
for i in issues: print(i)
if not issues: print('✅ Mobile UX виглядає добре')
"
```

### 5. Report

Сформуй фінальний звіт:

```
## Design Review — Iron Academy

### ♿ Accessibility
[результати кроку 2]

### 🎨 CSS Quality  
[результати кроку 3]

### 📱 Mobile UX
[результати кроку 4]

### 🔧 Рекомендації (пріоритет)
1. Критичне: ...
2. Важливо: ...
3. Бажано: ...

### Загальна оцінка
🟢 Добре / 🟡 Є що покращити / 🔴 Є критичні проблеми
```

Якщо все добре — скажи що сайт готовий до продакшну з точки зору дизайну.
Якщо є проблеми — запропонуй конкретні фікси і запитай чи хоче користувач їх виправити.
