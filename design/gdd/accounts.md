# Accounts and Cloud Saves — Design Document

---
**Status**: Implemented (v0.5.0)
**Source**: `src/index.html` (`ACCOUNT_CFG`, `ACC`, `initAccounts`, `accSignedIn`, `accGuest`, `accEmail`, `accLink`, `accSignOut`, `accClaimName`, `accPush`, `renderLogin`, `renderAccountDialog`, `accountSettings`, `beginLife`), `tools/supabase/schema.sql`
**Date**: 2026-11-05
**Verified By**: `tests/integration/accounts-smoke.js` (stand-in server), CI
**Implementation Status**: Fully implemented
---

## Overview

On the public site the game opens on a login screen. A player either enters as a **guest** (an anonymous account, no details asked) or uses an **email account** (email and password). A guest can later **link an email** and keep the same hero. Every account owns at most one hero, and every hero's name is **unique** across all players. The hero is saved to the cloud, so an email account continues on any device. Accounts run on Supabase (Auth plus two Postgres tables protected by row-level security). When the account server is not configured or cannot be reached, the game plays as before, saving on the device only.

## Player Fantasy

"Erandel knows me." My name is mine alone in the world, and when I pick up my phone after playing on a laptop, Mira is standing where I left her with her 777 gold.

## Detailed Rules

**Login screen** (`ui.screen = 'login'`): Aelarion's greeting; *Play as Guest* (one tap); *Email account* with email, password, *Sign in* and *Create account*. Errors are shown in plain words (wrong password, email already used, password too short, no connection).

**After signing in**: the cloud save is loaded if there is one. If not, a device save that has no owner yet (from before accounts) or belongs to this account is adopted and uploaded. Otherwise the player chooses a kind at the Thorngate as usual.

**Unique names**: choosing *Be reborn* claims the name in `profiles` first. Names are 2–20 characters of letters, numbers, spaces, apostrophes and hyphens; the database refuses a name that differs from an existing one only in letter case. If the name is taken the player stays on the Thorngate screen with the message "“Name” is already taken in Erandel. Choose another name." An account keeps its name when it starts a new life.

**Guest to email**: Settings shows *Link email to keep hero* for guests. Linking adds an email and password to the same account (Supabase `updateUser`), so the hero, gold and buildings stay. An email that already belongs to another account is refused.

**Sign out** (email accounts only, in Settings): uploads the save, signs out, clears the hero from this device and returns to the login screen. Guests are not offered sign out, because a guest who signs out cannot get back in.

**Cloud saves**: every local save schedules an upload within 15 s; sleeping, leaving the page (tab hidden) and signing out upload at once. The spell codex travels with the save.

**Start over** (journal): also deletes the cloud save; the name stays with the account.

**Security**: the page holds only the public (anon) key. Row-level security lets a player read and write only their own save and only create or change their own profile. Names are readable by everyone. Saves are capped at about 300 KB. Email confirmation is off so sign-up works at once without an email service (see Edge Cases).

**Multiplayer**: the presence name other players see is the account's unique name.

## Formulas

| Quantity | Rule |
|---|---|
| Upload delay | at most `ACCOUNT_CFG.pushEvery` = 15 000 ms after a change; immediate on sleep, page hidden, sign out, new life, linking |
| Name | `cleanName(n)`: control and invisible characters removed, only `\p{L}\p{N}` space `'` `-`, collapsed spaces, 2–20 chars; unique on `lower(name)` |
| Password | at least 8 characters (checked in the page and by Supabase) |
| Connect timeout | 15 000 ms, then device-only play with a notice |

## Edge Cases

- **Account server unreachable** (offline, paused free project): after 15 s the game plays on the device only and says so; nothing is uploaded.
- **Forgotten password**: there is no reset yet, because email sending needs a mail provider. A player who forgets their password must create a new account. Adding a mail provider (custom SMTP) would enable reset and email confirmation.
- **Same account on two devices at once**: the last upload wins.
- **Guest clears browser data**: the guest account and hero are lost (the cloud copy still exists but nobody can sign in to it). The guest card says the hero lives in this browser.
- **Name claimed, then the hero is reset**: the name stays reserved for that account.
- **The claude.ai page and downloaded copies**: `ACCOUNT_CFG` may be set, but if the library or server cannot load they fall back to device saves.

## Dependencies

- **Reads**: [Kinds and Bodies](kinds-and-bodies.md) (the Thorngate screen it gates), [Interface and Controls](interface-and-controls.md) (login screen, settings).
- **Used by**: [Multiplayer](multiplayer.md) (unique names shown to others), [Stats and Daily Actions](stats-and-actions.md) (saving after actions and sleep).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| `pushEvery` | 15 000 ms | 5 000–60 000 | Cloud write load vs. progress lost on a crash |
| `connectTimeout` | 15 000 ms | 5 000–30 000 | Wait before device-only play |
| Name length | 2–20 | 2–24 | Name plate width |
| Save size cap | 300 KB | 100–1 000 KB | Abuse protection |

## Acceptance Criteria

1. A guest enters with one tap, picks a name and plays; the name is stored and the save reaches the cloud within the upload delay (`accounts-smoke.js`).
2. Creating an email account with a 5-character password is refused; with 8+ it signs in at once.
3. A second player choosing "mIRa" when "Mira" exists is refused and stays on the Thorngate screen.
4. A guest who links an email keeps name, gold and kind; linking an email that belongs to another account is refused.
5. Signing in with that email on a new device restores the same hero from the cloud; a wrong password shows "Wrong email or password."
6. Reloading keeps the player signed in; signing out returns to the login screen and clears the device copy.
7. With no account server configured the game behaves exactly as before (unit and playthrough suites, main browser test).
