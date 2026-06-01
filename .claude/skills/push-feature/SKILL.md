---
name: push-feature
description: Commits all current changes and pushes to the develop branch of the Iron Academy project, then verifies the Next.js build passes. Use this skill whenever the user says "push", "запушити", "відправити в develop", "push feature", "commit and push", or wants to send their current work to the develop branch. Always use this skill before running qa-check or release.
---

# Push Feature to Develop

You are helping push a new feature to the `develop` branch of the Iron Academy Next.js project at `/Users/emotion/Desktop/iron-academy`.

## Steps

### 1. Get commit message
If the user provided a message as an argument, use it. Otherwise ask: "Яку назву коміту використати?" Default if they don't care: `"feat: update"`.

Format the message as: `feat: <message>` (unless user already includes a prefix like `fix:`, `chore:`, etc.)

### 2. Check what's changed
```bash
git -C /Users/emotion/Desktop/iron-academy status
git -C /Users/emotion/Desktop/iron-academy diff --stat HEAD
```
Show the user a brief summary of what will be committed.

### 3. Stage and commit
```bash
git -C /Users/emotion/Desktop/iron-academy add -A
git -C /Users/emotion/Desktop/iron-academy commit -m "<message>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### 4. Push to develop
```bash
git -C /Users/emotion/Desktop/iron-academy -c credential.helper="!gh auth git-credential" push origin develop 2>&1
```

If push fails — report the error and stop. Do not proceed.

### 5. Run Next.js build
```bash
PATH="/Users/emotion/.nvm/versions/node/v20.18.3/bin:$PATH" npx next build /Users/emotion/Desktop/iron-academy 2>&1
```

This takes ~30 seconds. Tell the user you're checking the build.

### 6. Report result

**If build FAILS:**
- Show the TypeScript/build error clearly
- Tell the user what needs to be fixed
- Do NOT suggest running /qa-check or /release

**If build PASSES:**
- Confirm: "✅ Запушено в develop, білд пройшов!"
- Tell the user: "Запусти `/qa-check` щоб протестувати, або `/release` щоб відразу злити в main."
