# Pushing ByteOS to GitHub

Your repo: **https://github.com/lorddannykay/ByteOS.git**

## Steps (run from the ByteOS root folder)

### 1. Ensure initial commit exists

```bash
cd C:\Users\dkaru002\Desktop\Dhani-Laboratory\ByteAI\ByteOS

git status
# If you see "nothing to commit, working tree clean", you're good.
# If you see untracked files, run:
git add -A
git commit -m "Initial commit: ByteOS - AI-native Learning OS with research foundation"
```

### 2. Set main branch and add remote

```bash
git branch -M main
git remote add origin https://github.com/lorddannykay/ByteOS.git
```

If you already added `origin`, use:

```bash
git remote set-url origin https://github.com/lorddannykay/ByteOS.git
```

### 3. Push to GitHub

```bash
git push -u origin main
```

- If GitHub prompts for auth, use a **Personal Access Token** (Settings → Developer settings → Personal access tokens) with `repo` scope, or sign in with GitHub CLI (`gh auth login`).
- If the remote already has a README/license and you get "failed to push (non-fast-forward)", run:
  ```bash
  git pull origin main --allow-unrelated-histories
  git push -u origin main
  ```

---

## What’s in the repo

- **README.md** — Project overview, research positioning, quick start.
- **RESEARCH_FOUNDATION.md** — Learning sciences, references, citation.
- **LICENSE** — MIT.
- **CONTRIBUTING.md** — How to contribute.
- **.gitignore** — Excludes `.env`, `.env.local`, `node_modules`, build outputs.
- **byteos-studio/** — Admin app (Next.js 14).
- **byteos-learn/** — Learner app (Next.js 14).
- **byteos-intelligence/** — Python FastAPI service.
- **docs/** — PRD, strategic path, action plans, features, personas, flows.
- **ECOSYSTEM.md**, **AGENTS.md** — Architecture and agent instructions.

Secrets (`.env`, `.env.local`) are **not** committed. Copy `.env.example` to `.env.local` in each app and fill in your keys after cloning.
