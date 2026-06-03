---
name: lighthouse
description: Runs a Lighthouse/PageSpeed audit on the Iron Academy production site and reports Performance, Accessibility, SEO, and Best Practices scores with actionable fixes. Use when the user says "lighthouse", "аудит", "перформанс", "швидкість сайту", "PageSpeed", "SEO", "доступність", or wants to know how to improve the site quality.
---

# Lighthouse Audit — Iron Academy

Аналізуємо `https://test-workout.vercel.app` через Google PageSpeed Insights API.

## Steps

### 1. Mobile audit
```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://test-workout.vercel.app&strategy=mobile" | python3 -c "
import sys, json
d = json.load(sys.stdin)
cats = d.get('lighthouseResult', {}).get('categories', {})
audits = d.get('lighthouseResult', {}).get('audits', {})

print('=== MOBILE ===')
for k, v in cats.items():
    score = round(v.get('score', 0) * 100)
    bar = '🟢' if score >= 90 else '🟡' if score >= 50 else '🔴'
    print(f'{bar} {v[\"title\"]}: {score}')

print()
print('=== TOP ISSUES ===')
failed = [(k, a) for k, a in audits.items() if a.get('score') is not None and a.get('score') < 0.9]
failed.sort(key=lambda x: x[1].get('score', 1))
for k, a in failed[:8]:
    score = round(a.get('score', 0) * 100)
    title = a.get('title', k)
    desc = a.get('displayValue', '')
    print(f'  [{score}%] {title}' + (f' — {desc}' if desc else ''))
" 2>&1
```

### 2. Desktop audit
```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://test-workout.vercel.app&strategy=desktop" | python3 -c "
import sys, json
d = json.load(sys.stdin)
cats = d.get('lighthouseResult', {}).get('categories', {})
print('=== DESKTOP ===')
for k, v in cats.items():
    score = round(v.get('score', 0) * 100)
    bar = '🟢' if score >= 90 else '🟡' if score >= 50 else '🔴'
    print(f'{bar} {v[\"title\"]}: {score}')
" 2>&1
```

### 3. Core Web Vitals
```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://test-workout.vercel.app&strategy=mobile" | python3 -c "
import sys, json
d = json.load(sys.stdin)
audits = d.get('lighthouseResult', {}).get('audits', {})
vitals = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index', 'interactive']
print('=== CORE WEB VITALS ===')
for v in vitals:
    a = audits.get(v, {})
    val = a.get('displayValue', 'n/a')
    score = a.get('score')
    bar = '🟢' if score and score >= 0.9 else '🟡' if score and score >= 0.5 else '🔴'
    print(f'{bar} {a.get(\"title\", v)}: {val}')
" 2>&1
```

### 4. Report

Сформуй підсумок:

```
## Lighthouse — Iron Academy

### Scores
Mobile: Performance X | Accessibility X | Best Practices X | SEO X
Desktop: Performance X | Accessibility X | ...

### Core Web Vitals
[таблиця з кроку 3]

### Топ проблем для виправлення
1. [найгірший score] — що робити
2. ...

### Що вже добре
- ...
```

Запропонуй конкретні дії для найнижчих scores. Наприклад:
- Accessibility < 90 → перевір aria-label, контраст кольорів (`/design-review`)
- Performance < 90 → розглянь image optimization, lazy loading, code splitting
- SEO < 90 → додай meta description, OG tags, sitemap
