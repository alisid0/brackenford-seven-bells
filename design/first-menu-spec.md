# First Menu Functional & VR Interaction Spec

What the first menu must **do** across desktop and Quest VR, reconciling `assets/concepts/title-menu-final.jpg`, `src/shell.html`, `Interface-design-rules.md`, `design/world-journey.md`, and `design/replay-plan.md` (`ec26a95`).

## 1. First-Time Player & Fewest Steps to Arrow #1

- **Must see:** Live 3D Willowbank Range behind the cream cloth banner; title **`Bow & Shadow`**, subtitle **`Early build`**, one-line hook; **one red primary button** (`Begin` on desktop; `Enter VR` on Quest Browser, with secondary cream `Play on screen` below); one subtle **`Settings`** button.
- **Must NOT ask before arrow #1:** Stage picker (only Stage 1 is open), 4-toggle VR Comfort wall, Draw mode, Bow hand, 8-row controls table, Daily Trial, World Map, Start over, or unbuilt features (`Move between spots`). Stage 1's guide board teaches shooting in play; VR hand-swap (grip) and draw-mode swap (right-stick click) work anytime.
- **Fewest steps to first shot:**
  - **Desktop:** Open page → **1 click (`Begin`)** → live on Stage 1 `First marks` → draw & loose (~3 s).
  - **Quest Browser:** Open page → **1 click (`Enter VR`)** → enters VR **straight onto Stage 1** with bow in hand and low guide board ahead (zero second menu click inside VR for first-timers).

## 2. Returning Player View (`stars > 0` or `shots > 0`)

- **Top progress strip (under title):** `★ X / 51` · `Ribbons X / 17` · `X/3 days this week` *(Update 1+)*.
- **Primary red button:** **`Continue`** with sub-label showing exact destination (`Willowbank · The drop`). Drops straight onto that stance in 1 click.
- **Secondary cream buttons:** **`World Map`** *(Update 2+; **`Stages`** in 1-place launch)*, **`Daily Trial`** *(Update 1+, showing today's place & `0/3` tries or medal)*, and **`Settings`**.
- **On Quest Browser (2D pre-VR):** Still **1 click** on red **`Enter VR`** → lands inside VR at their current stance facing the 3D returning banner (`Continue`, `World Map`, `Daily Trial`, `Settings`).

## 3. Full Reachability Inventory & Fate of the Stage Dropdown

| Location | Controls | Rules |
|---|---|---|
| **On Banner Face** | **New:** Title, `Begin` (or `Enter VR` on Quest), `Settings`.<br>**Returning:** Title + progress strip, `Continue (<Place · Stage>)`, `World Map` *(or `Stages`)*, `Daily Trial` *(U1+)*, `Settings`, `Enter VR` (if WebXR available on desktop). | Strictly **one red button** (`Interface-design-rules.md`); zero toggles on face. |
| **One Step Away (`Settings`)** | **Play:** `Bow hand` (Right/Left), `Draw mode` (Two/Single-handed).<br>**VR Comfort:** `Play posture` (Auto/Standing/Seated), `Height comfort` (Off/On), `Scenery sway` (On/Off), `Replays in VR` (On/Off).<br>**Help & Data:** 4-line `Controls` card, 2-step `Start over` (`Confirm?`), `Copy playtest summary` (test builds only). | Opens as a clean cloth sub-panel replacing the banner face with a `Back` button. |
| **Excluded Entirely** | `Move between spots: Fade / Short walk` (not in stationary Trials), `Roam the vale`, `Stage` dropdown on face, 8-row keybinding table, unspendable `Coins` count. | Obeys `Release-checklist.md` L12 (no unbuilt promises). |

- **Where the `Stage` dropdown goes:** **Deleted** once the World Map ships—picking any unlocked Place on the map shows its 3–6 stages (`★`, ribbon, best) plus Arcade tabs. In the 1-place launch, a **`Stages`** secondary button (returning players only) opens a clean unlocked-stage list instead of a native `<select>` on the front face.

## 4. Menu Inside VR

- **Flow:** 2D Quest Browser page hosts the mandatory WebXR gesture (`Enter VR`). Inside VR, first-timers go straight to Stage 1; returning players (or anyone opening Menu via pause/wrist control) face a **3D cloth banner** hung between two timber posts ahead of the rail.
- **Geometry & readability:**
  - **Distance:** **`3.2 m`** from `(0, 0)` (clear of `1.05 m` rail and full-draw reach; zero convergence strain).
  - **Size:** **`2.6 m W × 1.5 m H`** (`44° × 26°` angular span; readable without head-turning).
  - **Height (standing & seated):** Vertical centre at **`eyeHeight - 0.10 m`** (`y_stance + 1.50 m` standing; automatically lowers to **`y_stance + 1.05 m`** when `Seated` or tracked HMD `< 1.35 m`), bottom clear of the `0.75 m` rail.
  - **Typography:** Dark plum `#4A2943` on cream `#f6e6bd`, labels `≥ 48 px` on `1024×590` canvas (`≥ 1.2°` tall).
- **Interaction:** **Both** work simultaneously—**shoot a button** with the bow (heroic for `Continue` / `World Map`, matching `AGAIN` / `NEXT` signs) **or ray-point + trigger click** with an undrawn hand (effortless for flipping `Settings` toggles, especially seated).

## 5. First Menu vs World Map

- **Two separate screens**, never merged: the **First Menu** gets players shooting in 1 click (`Continue` / `Daily Trial`); the **World Map** is the spatial 6-place journey board.
- **Navigation:** `First Menu → World Map` (button/sign) → pick unlocked Place → side card lists stages & Arcade → `0.5 s` VR fade to stance. `Map` sign on any results screen opens the Map directly; `Back` (`Esc` desktop / `B` VR) returns from Map to First Menu.

## 6. Defaults & Saved State

| Setting | Default | Saved (`localStorage`) | Notes |
|---|---|---|---|
| `Bow hand` | **`Right`** | `state.hand` | VR opposite-hand bow grip updates automatically. |
| `Draw mode` | **`Two-handed`** | `state.draw` | Right-stick click toggles live in VR. |
| `Play posture` | **`Auto`** (Seated if `< 1.35 m` or chosen) | `state.posture` | Adjusts 3D banner/sign height & seated clearance. |
| `Height comfort` | **`Off`** | `state.comfort.height` | Show VR height/drop by default; toggle `On` if needed. |
| `Scenery sway` | **`On`** | `state.comfort.sway` | Platform never moves; toggles pennant/tree motion. |
| `Replays in VR` | **`On`** (fade + trigger skip) | `state.comfort.vrReplay` | Covers `Release-checklist.md` L60 fallback. |
| `Progress & place` | `Willowbank · First marks` | `stars[stageId]`, `best[stageId]`, `ribbons[stageId]`, `daily`, `practiceDates`, `currentPlace`, `lastStageByPlace` | Stable stage-ID keys; wiped only by 2-step `Start over`. |

## 7. Release Split: First Release (1 Place) vs Six-Place Journey

| First Release (1 Place — Willowbank Range) | Update 1 & Update 2+ (Six-Place Journey) |
|---|---|
| Cream cloth banner styling replacing `src/shell.html`'s dark card; 1-click `Begin` / `Enter VR` for new players; `Continue` + `Stages` for returning players. | `Daily Trial` button & weekly rhythm strip on returning banner (Update 1). |
| `Settings` sub-panel (`Bow hand`, `Draw mode`, `Play posture`, `Replays in VR`, 4-line `Controls`, 2-step `Start over`, test-only `Copy playtest summary`). | `World Map` screen replacing `Stages`, Place Crowns/keepsakes, per-place Arcade tabs, and `Height comfort` / `Scenery sway` toggles once raised stands ship (Update 2+). |
| 1-click Quest `Enter VR` straight into Stage 1 (first-timers) or 3D banner at `3.2 m` (returning). | Full 3D World Map board inside VR. |

## 8. Plain Changes Needed to `assets/concepts/title-menu-final.jpg`

1. **Remove from face:** The entire `VR Comfort` 4-toggle column, `Stage` dropdown, `Draw mode`, and `Bow hand` (move valid settings into the `Settings` sub-panel; **delete `Move between spots: Fade / Short walk`** completely).
2. **Fix defaults shown:** In the picture `Height comfort` is red (`On`) and `Scenery sway` is red (`Off`)—reverse both defaults inside `Settings`.
3. **Add `Replays in VR` (On/Off)**, a compact **4-line `Controls` card**, and a **2-step `Start over`** inside `Settings`.
4. **Split into two clean banner layouts:** Uncluttered **First-time face** (`Begin` / `Enter VR` + `Settings`) and **Returning face** (progress strip + `Continue`, `World Map`, `Daily Trial`, `Settings`), keeping strictly **one red primary button** (`Enter VR` red on Quest).
5. **Minor art mismatches in the picture's background:** Remove loose pink ground petals and replace blue target rings with the game's cream/red/gold target rings.
