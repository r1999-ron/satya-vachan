# Satya-Vachan Product Specification

## Purpose

This document breaks Satya-Vachan into implementation modules that can be used as sequential prompts for Codex. Each module builds on the previous module and includes functional requirements, UI behavior, business logic, data models, APIs, validations, edge cases, dependencies, and acceptance criteria.

Satya-Vachan is an AI-powered Hindi expression coach for fluent Hindi speakers who want to sound more elegant, articulate, cultured, and eloquent. The app does not teach Hindi from scratch. It upgrades everyday spoken Hindi into refined, natural Hindi, explains the changes, speaks the improved version back, and helps users build a personal vocabulary through daily challenges and light gamification.

The MVP should be built for deployment on Vercel.

## Product Principles

- The app must feel aspirational, not corrective.
- Never shame simple Hindi, conversational Hindi, or English-mixed Hindi.
- Frame feedback as "Here is a more elegant way to say this."
- Keep the default transformed sentence natural and usable in ordinary speech.
- Keep the more elevated version available, but do not make it the default.
- The app should feel modern, warm, softly layered, lightly gamified, animated, and demo-friendly.
- The product must work without authentication or a database for the MVP.

## Recommended Stack

- Framework: Next.js App Router
- Language: TypeScript
- Styling: Tailwind CSS
- UI components: custom components or shadcn/ui, consistent with the chosen project setup
- Animation: Framer Motion or CSS transitions, depending on setup
- Icons: lucide-react
- AI provider: OpenAI
- Storage: browser localStorage for MVP
- Deployment: Vercel

## Target File Structure

```text
/app
  /api
    /challenge/route.ts
    /transform/route.ts
    /transcribe/route.ts
    /tts/route.ts
  /challenge/page.tsx
  /learned/page.tsx
  /practice/page.tsx
  /globals.css
  /layout.tsx
  /page.tsx
/components
  /audio
    AudioPlayer.tsx
    RecorderButton.tsx
  /challenge
    ChallengeFeedback.tsx
    ChallengePrompt.tsx
  /layout
    AppShell.tsx
    BottomNav.tsx
    Header.tsx
  /learned
    LearnedWordCard.tsx
  /practice
    EleganceScore.tsx
    HintPromptList.tsx
    TransformationResult.tsx
    WordReplacementCard.tsx
  /ui
    GlassCard.tsx
    ProgressRing.tsx
    StatusBadge.tsx
/data
  /demo.ts
  /words.ts
/lib
  /audio.ts
  /dates.ts
  /openai.ts
  /prompts.ts
  /storage.ts
  /validators.ts
/types
  /index.ts
```

If the generated project uses a different but equivalent structure, keep module boundaries and behavior the same.

## Shared Data Models

Use these TypeScript types or equivalent compatible types.

```ts
export type RegisterLevel = "common" | "formal" | "literary";

export type WordEntry = {
  id: string;
  common: string;
  elevated: string;
  englishMeaning: string;
  simpleExample: string;
  elevatedExample: string;
  synonyms: string[];
  usageNote: string;
  challengePrompt: string;
  tags: string[];
  difficulty: "easy" | "medium" | "advanced";
};

export type WordReplacement = {
  original: string;
  replacement: string;
  meaning: string;
  whyBetter: string;
  naturalness: RegisterLevel;
};

export type PracticeResponse = {
  transcript: string;
  naturalElegantVersion: string;
  elevatedVersion: string;
  originalEleganceScore: number;
  improvedEleganceScore: number;
  feedback: string;
  replacements: WordReplacement[];
  saveableWords: LearnedWordInput[];
};

export type LearnedWord = {
  id: string;
  word: string;
  meaning: string;
  simpleAlternative?: string;
  exampleSentence: string;
  savedAt: string;
  source: "seed" | "practice" | "challenge" | "manual";
};

export type LearnedWordInput = {
  word: string;
  meaning: string;
  simpleAlternative?: string;
  exampleSentence: string;
};

export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  completedChallenges: string[];
};

export type ChallengeResponse = {
  transcript: string;
  usedTargetWord: boolean;
  acceptableUsage: boolean;
  feedback: string;
  suggestedImprovement?: string;
  completed: boolean;
};

export type TtsResponse = {
  audioBase64: string;
  mimeType: "audio/mpeg";
};
```

## Shared Local Storage Keys

```ts
const STORAGE_KEYS = {
  learnedWords: "satya-vachan.learnedWords",
  streak: "satya-vachan.streak",
  practiceHistory: "satya-vachan.practiceHistory",
  preferences: "satya-vachan.preferences",
};
```

All localStorage access must be guarded for server-side rendering. Use client-only hooks or helper functions that check `typeof window !== "undefined"`.

## Module 1: Project Foundation and Visual System

### Objective

Create the base Next.js application shell, global styling, three-destination navigation, responsive layout, warm soft-UI theme, and reusable UI primitives that every later screen will use.

### Dependencies

- None, except the initialized Next.js project.

### Requirements

- Configure TypeScript, Tailwind CSS, and App Router.
- Add global metadata for Satya-Vachan.
- Add app-wide navigation for Home, Practice, and My Words. The daily challenge is a Practice mode, not a fourth destination.
- Create a responsive app shell that works on mobile and desktop.
- Use a warm soft-UI visual style:
  - warm cream surfaces with restrained translucency
  - subtle blur and borders
  - soft shadows with no more than one nested visual panel
  - amber for brand and primary emphasis
  - green only for success or improvement and red only for destructive actions
  - high readability over all backgrounds
- Add a lightly gamified feel:
  - streak badges
  - small completion animations
  - score movement animation
  - tactile button states
- Avoid a childish game aesthetic. The app should feel refined and focused.
- Do not use a marketing landing page as the first screen. The first screen is the actual product home.
- Use icons for navigation and action buttons where appropriate.

### UI Behavior

- Mobile:
  - Use a bottom navigation bar with three primary destinations: Home, Practice, and My Words.
  - Emphasize Practice as the center action because speaking is the core interaction.
  - Keep primary calls to action thumb-friendly.
  - Avoid overlapping fixed elements with page content.
- Desktop:
  - Use a top or side navigation layout.
  - Keep content constrained to a readable width.
  - Use multi-column sections when helpful.
- The background may animate subtly, but must not distract from reading Hindi text.
- Respect `prefers-reduced-motion` by reducing nonessential animations.

### Business Logic

- No product-specific business logic yet.
- Establish utility functions for class merging and date formatting if needed.

### Data Models

- Add shared types from the "Shared Data Models" section.

### Validations

- Ensure the app renders without environment variables.
- Ensure navigation does not depend on OpenAI routes.
- Ensure all client-only browser APIs are isolated from server components.

### Edge Cases

- Small screens under 360px width.
- Long Hindi or romanized Hindi words inside cards.
- Reduced motion users.
- Dark and light system preferences if supported.

### Acceptance Criteria

- The app starts locally without runtime errors.
- The three main routes exist and display product content.
- Navigation works between Home, Practice, and My Words; `/challenge` redirects to `/practice?challenge=today`.
- The visual system clearly reads as warm, refined, softly layered, and lightly gamified.
- Layouts are responsive and text does not overlap at common mobile and desktop widths.

### Codex Prompt

Build the Next.js App Router foundation for Satya-Vachan with TypeScript, Tailwind, a responsive app shell, warm soft-UI theme, navigation across Home, Practice, and My Words, shared type definitions, and reusable UI primitives. Keep the daily challenge inside Practice at `/practice?challenge=today` and ensure the app is Vercel-ready.

## Module 2: Static Content, Word Corpus, and Demo Data

### Objective

Add the curated Word of the Day corpus, seed learned words, hint prompts, and demo content needed to make the app useful before AI integration.

### Dependencies

- Module 1 complete.

### Requirements

- Create `/data/words.ts` with 50 to 60 curated Hindi vocabulary entries.
- Each entry must include:
  - common/simple word or expression
  - elevated replacement
  - English meaning
  - simple example sentence
  - elevated example sentence
  - synonyms
  - usage note
  - challenge prompt
  - tags
  - difficulty
- Keep examples elegant but not absurdly archaic.
- Include practical replacements such as:
  - kaam -> karya
  - koshish -> prayas
  - jaldi -> sheeghra
  - matlab -> arth
  - yaani -> arthaat
  - soch -> vichaar
  - nazariya -> drishtikon
  - sahi -> uchit
  - zaroori -> avashyak
  - madad -> sahayata
  - problem -> samasya
  - solution -> samadhan
  - clear -> spasht
  - confusion -> aspashtata
- Avoid making all examples heavily Sanskritized.
- Create `/data/demo.ts` with:
  - hint practice sentences
  - default transformation example
  - seed learned words
  - optional empty-state examples

### UI Behavior

- Placeholder pages should now use realistic content from the corpus.
- Long examples should wrap cleanly.
- Word cards should visually distinguish common word, elevated word, meaning, and example.

### Business Logic

- Implement deterministic Word of the Day selection:
  - Select a word based on local calendar date.
  - Use a stable date key in `YYYY-MM-DD`.
  - Index may be computed from days since an epoch modulo corpus length.
- Add helpers:
  - `getTodayKey()`
  - `getWordOfTheDay(date?: Date)`
  - `getDemoHints()`

### Data Models

- Use `WordEntry`.

### Validations

- Every word entry must have a unique id.
- Required fields must be present.
- Synonyms must be arrays, not comma-separated strings.
- Examples must not be empty.

### Edge Cases

- Corpus is empty: show a graceful fallback word card.
- Date/timezone differences: choose the local browser date for MVP consistency.
- Very long synonyms list: wrap or clamp visually.

### Acceptance Criteria

- Home and challenge pages can display today's word from the corpus.
- Practice page can display hint prompts.
- Learned Words page has seed words available for empty states.
- No API or localStorage is required for this module to work.

### Codex Prompt

Add a curated Satya-Vachan word corpus, deterministic Word of the Day helper, demo hint prompts, seed learned words, and realistic placeholder content across the existing screens. Validate corpus shape in TypeScript and keep the language refined but natural.

## Module 3: Local Storage, Progress, and Learned Words State

### Objective

Implement local-only persistence for learned words, daily challenge progress, streaks, and simple practice history.

### Dependencies

- Module 1 complete.
- Module 2 complete.

### Requirements

- Create `/lib/storage.ts` with safe localStorage helpers.
- Implement learned words persistence:
  - load learned words
  - save a word
  - remove a word
  - prevent duplicates
  - merge seed words only when user has no saved words
- Implement streak persistence:
  - load streak state
  - complete today's challenge
  - maintain current streak
  - maintain longest streak
  - prevent multiple completions from increasing the same day's streak twice
- Implement optional practice history:
  - store recent transformed sentences locally
  - cap history to a small number, such as 10
- Add React hooks if useful:
  - `useLearnedWords()`
  - `useStreak()`
  - `usePracticeHistory()`

### UI Behavior

- Learned Words page displays saved words from localStorage.
- Learned Words page supports removing a saved word.
- Empty state displays seeded words or a useful message.
- Home page displays current streak and saved words count.
- Daily Challenge page displays whether today's challenge is already complete.

### Business Logic

- Duplicate learned words:
  - Match case-insensitively.
  - Prefer exact word match after trimming.
  - If duplicate, update example/meaning only if the existing value is missing.
- Streak completion:
  - If no previous completion, set current and longest streak to 1.
  - If last completed date is yesterday, increment current streak.
  - If last completed date is today, do not increment.
  - If last completed date is older than yesterday, reset current streak to 1.
  - Always add today's date to completedChallenges if missing.

### Data Models

- `LearnedWord`
- `LearnedWordInput`
- `StreakState`

### APIs

- No server APIs in this module.

### Validations

- Do not save a learned word without a non-empty `word` and `meaning`.
- Trim all string fields before saving.
- Generate stable ids with `crypto.randomUUID()` where available; fall back to timestamp-based ids.
- Handle malformed localStorage JSON by resetting to safe defaults.

### Edge Cases

- localStorage disabled or unavailable.
- Corrupt stored data.
- User opens app in server-rendered state before hydration.
- User removes all words.
- Timezone changes across midnight.

### Acceptance Criteria

- Learned words survive page refresh.
- Removing a word survives page refresh.
- Saving a duplicate word does not create duplicate cards.
- Completing today's challenge updates streak once.
- Malformed localStorage values do not crash the app.

### Codex Prompt

Implement localStorage-backed learned words, streak state, and recent practice history for Satya-Vachan. Add safe storage helpers, hooks, duplicate handling, streak date logic, and connect the state to Home, Daily Challenge, and Learned Words screens.

## Module 4: Home Screen

### Objective

Build the complete product home screen that explains the app quickly, shows progress, and routes users into the main loop.

### Dependencies

- Module 1 complete.
- Module 2 complete.
- Module 3 complete.

### Requirements

- Display app name: Satya-Vachan.
- Display a slim greeting row with readable date, tagline, saved-word count, and streak state.
- Show today's word as the page hero:
  - common word
  - elevated word
  - English meaning
  - common and elevated word pair
  - English meaning
- Put simple/elevated examples, synonyms, and usage note inside a Details disclosure.
- Show one primary action that starts today's challenge in Practice.

### UI Behavior

- Primary action should lead to `/practice?challenge=today`.
- Word of the Day card should have subtle entrance animation.
- Streak should be a compact chip, with a completed state and a first-day invitation when the streak is zero.
- Do not hide core CTAs below excessive hero content.

### Business Logic

- Read today's word from corpus helper.
- Read streak and learned words from local state hooks.
- If storage is unavailable, show zero streak and seed learned words count.

### Data Models

- `WordEntry`
- `StreakState`
- `LearnedWord`

### APIs

- No server APIs in this module.

### Validations

- Ensure all links are accessible and keyboard-focusable.
- Ensure Hindi/romanized text wraps.

### Edge Cases

- No learned words yet.
- Challenge already completed today.
- Corpus fallback if today's word cannot be selected.

### Acceptance Criteria

- A first-time user understands the app within 30 seconds.
- User can enter today's challenge or navigate to Practice and My Words.
- Home reflects persisted streak and learned words count.
- The visual design matches the warm, refined soft-UI theme.

### Codex Prompt

Build the full Satya-Vachan Home-as-Today screen using the existing corpus and local progress state. Show a compact greeting and streak row, Word of the Day hero, one action into `/practice?challenge=today`, and disclosed details with warm soft-UI styling and subtle animation.

## Module 5: Practice Screen Static Flow

### Objective

Build the Practice screen UI and state machine using mock data before audio and AI integration.

### Dependencies

- Module 1 complete.
- Module 2 complete.
- Module 3 complete.
- Module 4 complete.

### Requirements

- Create a Practice screen with:
  - recording panel placeholder
  - hint prompt list
  - transcript area
  - natural elegant version
  - more elevated version
  - elegance score display
  - feedback block
  - word replacement cards
  - save word buttons
  - listen buttons placeholder
- Include a "Try demo sentence" flow using the best demo sentence:
  - "Humne is kaam ko jaldi khatam karne ki koshish ki."
- Show the expected demo result:
  - Natural elegant: "Humne is karya ko sheeghra samaapt karne ka prayas kiya."
  - More elevated: "Humne is karya ko atishighra sampann karne ka gambhir prayatna kiya."
- Let users click hint prompts to fill the transcript and show a mock transformation.
- Save replacement words into learned words.

### UI Behavior

- Practice screen should make the main action obvious.
- Hint prompts should be tappable chips or compact cards.
- Transformation result should animate in after mock submission.
- Score should show original and improved score with visible improvement.
- Save buttons should change state after a word is saved.
- Elevated version should be visually secondary to the natural elegant version.

### Business Logic

- Use local mock transformation data until API is integrated.
- Support states:
  - idle
  - ready with selected hint
  - processing mock
  - completed
  - error
- Saving a word must call learned word storage.

### Data Models

- `PracticeResponse`
- `WordReplacement`
- `LearnedWordInput`

### APIs

- No server APIs in this module.

### Validations

- Do not submit an empty transcript.
- Disable action buttons during processing.
- Avoid duplicate saves.

### Edge Cases

- Very short sentence.
- Very long sentence.
- User clicks multiple hints quickly.
- User saves all replacement words.
- User has already saved a word from another screen.

### Acceptance Criteria

- Practice screen fully demonstrates the product loop with mock data.
- Hint prompts work.
- Demo sentence works.
- Save word buttons persist learned words.
- No AI key or microphone access is required yet.

### Codex Prompt

Build the full Practice screen as a static/mock interactive flow. Include hint prompts, transcript display, mock transformation result, score, feedback, word replacement cards, save-to-learned-words behavior, and elegant glassmorphic animations. Use the canonical demo sentence and result.

## Module 6: Audio Recording

### Objective

Add browser microphone recording with the MediaRecorder API and connect recorded audio to the unified Practice screen, including challenge mode.

### Dependencies

- Module 5 complete.

### Requirements

- Create reusable audio recording utilities in `/lib/audio.ts`.
- Create `RecorderButton` component.
- Support recording states:
  - unsupported
  - permission needed
  - idle
  - recording
  - stopping
  - recorded
  - error
- Use MediaRecorder to capture audio.
- Store the recording as a Blob or File suitable for upload.
- Show recording duration.
- Show visual recording feedback, such as pulse ring or waveform-like animation.
- Let user discard and re-record.
- Use recorded audio on Practice screen first.
- Reuse the same mounted component when Practice enters challenge mode; do not create a second recorder surface.

### UI Behavior

- Before permission, show a clear mic action.
- During recording, show elapsed time and a stop button.
- After recording, show recorded state and action to process.
- If unsupported, show a text fallback input.
- Keep animation subtle and responsive.

### Business Logic

- Prefer supported MIME types in this order:
  - `audio/webm;codecs=opus`
  - `audio/webm`
  - `audio/mp4`
- If no supported type is found, let browser choose.
- Limit recordings to a reasonable maximum, such as 30 seconds for MVP.
- Stop all media tracks after recording ends.

### Data Models

```ts
type RecordingResult = {
  blob: Blob;
  mimeType: string;
  durationMs: number;
};
```

### APIs

- No server APIs in this module.

### Validations

- Do not start a second recording while already recording.
- Do not process without a recording or fallback transcript.
- Enforce max recording duration.
- Handle permission denial.

### Edge Cases

- Browser does not support MediaRecorder.
- User denies microphone permission.
- User starts recording and navigates away.
- Recording produces empty blob.
- Mobile Safari MIME type differences.

### Acceptance Criteria

- User can record, stop, discard, and re-record.
- Recorded Blob is available to the Practice screen state.
- Unsupported browsers get a usable text fallback.
- Media tracks are cleaned up after recording.

### Codex Prompt

Add reusable MediaRecorder-based audio recording to Satya-Vachan. Build an elegant RecorderButton with recording states, duration, max-length handling, permission errors, cleanup, re-record support, and a text fallback for unsupported browsers. Connect it to the Practice screen without calling AI APIs yet.

## Module 7: OpenAI Server Foundation and Transcription API

### Objective

Create server-side OpenAI configuration and a transcription route that accepts recorded audio and returns Hindi transcript text.

### Dependencies

- Module 6 complete.

### Requirements

- Install and configure the official OpenAI Node SDK.
- Create `/lib/openai.ts` for server-only OpenAI client creation.
- Use `OPENAI_API_KEY` from environment variables.
- Create `/app/api/transcribe/route.ts`.
- Route accepts multipart form data with an audio file.
- Route returns JSON:
  - `transcript: string`
  - optional `durationMs`
- Use `gpt-4o-mini-transcribe` by default.
- Keep all OpenAI calls server-side only.
- Add useful error responses for missing key, missing file, oversized file, and provider errors.

### UI Behavior

- Practice screen can upload recorded audio.
- During transcription, show loading state such as "Listening carefully..."
- Display transcript after transcription.
- Allow user to edit transcript before transformation.

### Business Logic

- Max audio duration should be enforced client-side.
- Max upload size should be enforced server-side, such as 10 MB.
- Include language hint for Hindi if the SDK/model supports it.
- Trim transcript before returning.

### APIs

#### POST `/api/transcribe`

Request:

```text
multipart/form-data
file: audio file
durationMs?: number
```

Success response:

```ts
{
  transcript: string;
  durationMs?: number;
}
```

Error response:

```ts
{
  error: string;
  code: "MISSING_FILE" | "FILE_TOO_LARGE" | "MISSING_API_KEY" | "TRANSCRIPTION_FAILED";
}
```

### Validations

- File must exist.
- File size must be under limit.
- File MIME type should begin with `audio/` or be a known browser recording type.
- Transcript must not be empty.

### Edge Cases

- No API key in local dev.
- API key exists locally but not on Vercel.
- User records silence.
- User speaks Hinglish or English-mixed Hindi.
- Transcription returns text in Devanagari or romanized Hindi. Both should be accepted.

### Acceptance Criteria

- Recording from Practice screen can be sent to `/api/transcribe`.
- Route returns transcript JSON.
- Missing API key gives a clear error without exposing secrets.
- Frontend shows transcript and lets user continue or edit.

### Codex Prompt

Add server-side OpenAI setup and a `/api/transcribe` route for Satya-Vachan. Accept recorded audio via multipart form data, transcribe with `gpt-4o-mini-transcribe`, return transcript JSON, handle common errors, and connect the Practice screen to show and edit the transcript.

## Module 8: Transformation API

### Objective

Implement the AI sentence transformation API that turns a transcript into natural elegant Hindi, a more elevated version, score, feedback, and word-level explanations.

### Dependencies

- Module 7 complete.

### Requirements

- Create `/lib/prompts.ts` with transformation system prompt and schema guidance.
- Create `/app/api/transform/route.ts`.
- Route accepts transcript JSON.
- Route returns a validated `PracticeResponse`.
- AI must produce:
  - original transcript
  - natural elegant Hindi version
  - more elevated Hindi version
  - original elegance score
  - improved elegance score
  - feedback
  - word replacements
  - saveable words
- Preserve original meaning.
- Avoid overly archaic default output.
- Avoid shaming language.
- Return structured JSON only.

### Prompt Requirements

The system prompt must include:

```text
You are Satya-Vachan, an AI Hindi expression coach.
Help fluent Hindi speakers express the same idea in more elegant, clear, expressive Hindi.
Always preserve the user's meaning.
Produce two versions:
1. Natural elegant Hindi: refined but usable in normal speech.
2. More elevated Hindi: more formal, literary, or Sanskritized, but still grammatically correct.
Avoid comically archaic Hindi.
Prefer words an educated Hindi speaker could realistically use.
Explain changes in a supportive tone.
Return only valid JSON matching the schema.
```

### UI Behavior

- Practice screen sends edited transcript to `/api/transform`.
- Show loading state such as "Elevating your expression..."
- Display transformation result.
- Auto-scroll result into view on mobile.
- If API fails, keep the transcript and show retry.

### Business Logic

- Scores:
  - Must be integers from 0 to 100.
  - Improved score should usually be higher than original score.
  - If the original is already elegant, improved score can be equal or slightly higher with explanatory feedback.
- Replacements:
  - Should focus on reusable vocabulary.
  - Do not include filler changes unless educational.
  - Include 2 to 6 replacements for typical sentence.
- Saveable words:
  - Should correspond to useful replacements.

### APIs

#### POST `/api/transform`

Request:

```ts
{
  transcript: string;
}
```

Success response:

```ts
PracticeResponse
```

Error response:

```ts
{
  error: string;
  code: "EMPTY_TRANSCRIPT" | "MISSING_API_KEY" | "TRANSFORM_FAILED" | "INVALID_MODEL_RESPONSE";
}
```

### Validations

- Transcript must be non-empty after trimming.
- Transcript length should be capped, such as 1000 characters.
- Validate AI JSON before returning.
- Clamp scores to 0 to 100 if needed.
- Ensure replacement arrays exist even if empty.

### Edge Cases

- User speaks only one word.
- User speaks a sentence already in elevated Hindi.
- User speaks mostly English.
- Model returns invalid JSON.
- Model returns output that changes intent.
- Model returns too many replacements.

### Acceptance Criteria

- `/api/transform` returns the expected structured response.
- Practice screen displays real transformation result.
- Invalid model response is handled gracefully.
- User can save words from real AI output.

### Codex Prompt

Implement Satya-Vachan's `/api/transform` route with a strong Hindi expression coach prompt, structured JSON response, validation, score normalization, error handling, and frontend integration. The Practice screen should transform a transcript into natural elegant Hindi, a more elevated version, feedback, scores, replacement cards, and saveable words.

## Module 9: Text-to-Speech API and Playback

### Objective

Generate and play audio for the natural elegant and elevated Hindi versions.

### Dependencies

- Module 8 complete.

### Requirements

- Create `/app/api/tts/route.ts`.
- Use `gpt-4o-mini-tts`.
- Accept text and optional variant.
- Generate audio for the natural elegant version by default.
- Support manual playback for the elevated version.
- Return audio in a format the frontend can play, such as base64 MP3.
- Create reusable `AudioPlayer` component.
- Cache generated audio in component state for the current result to avoid repeated calls.

### Voice Instructions

Use instructions like:

```text
Speak in clear, elegant Hindi with a calm teacher-like tone. Pronounce Sanskritized Hindi words carefully. Keep the delivery natural, not theatrical.
```

### UI Behavior

- After transformation, automatically request or prepare TTS for the natural elegant version.
- User can click listen for natural elegant version.
- User can click listen for elevated version.
- Show loading state on listen buttons.
- Disable listen buttons while generating audio.
- Playback controls must be accessible.

### Business Logic

- TTS text must be capped to a safe length.
- Do not call TTS for empty text.
- If auto-play is blocked by browser policy, show a play button.
- Store generated object URLs and revoke them when component unmounts.

### APIs

#### POST `/api/tts`

Request:

```ts
{
  text: string;
  variant?: "natural" | "elevated";
}
```

Success response:

```ts
{
  audioBase64: string;
  mimeType: "audio/mpeg";
}
```

Error response:

```ts
{
  error: string;
  code: "EMPTY_TEXT" | "TEXT_TOO_LONG" | "MISSING_API_KEY" | "TTS_FAILED";
}
```

### Validations

- Text must be non-empty.
- Text length must be capped, such as 800 characters.
- Variant must be recognized if provided.

### Edge Cases

- Browser blocks autoplay.
- TTS API fails after transformation succeeds.
- User clicks listen repeatedly.
- User navigates away during audio generation.
- Generated audio base64 is invalid.

### Acceptance Criteria

- User can hear the natural elegant sentence.
- User can hear the elevated sentence on demand.
- TTS failures do not erase transformation results.
- Listen buttons show clear loading and error states.

### Codex Prompt

Add Satya-Vachan's `/api/tts` route using `gpt-4o-mini-tts` and connect it to Practice result playback. Build accessible listen controls for natural and elevated versions, handle browser autoplay limits, cache current-result audio, and keep failures isolated from the transformation flow.

## Module 10: Complete Practice Flow

### Objective

Connect recording, transcription, transformation, TTS, learned word saving, error handling, and history into one elegant core product loop.

### Dependencies

- Module 9 complete.

### Requirements

- Practice flow:
  1. User records audio or types fallback text.
  2. App sends audio to `/api/transcribe`.
  3. App displays editable transcript.
  4. User confirms or transforms.
  5. App sends transcript to `/api/transform`.
  6. App displays transformation.
  7. App generates or offers TTS playback.
  8. User saves useful words.
  9. App stores recent practice result locally.
- Include retry actions for transcription, transform, and TTS errors.
- Include reset/new practice action.
- Preserve transcript if a later step fails.

### UI Behavior

- Use a clear step-based visual state.
- Avoid overwhelming the screen during recording.
- Results should appear in an elegant glass panel with score animation.
- Replacement cards should be scannable.
- Saving a word should give immediate visual feedback.
- Recent practice history may appear as a compact section if implemented.

### Business Logic

- Centralize practice state with a reducer or clear state object.
- State machine:
  - idle
  - recording
  - recorded
  - transcribing
  - transcriptReady
  - transforming
  - resultReady
  - ttsLoading
  - error
- Keep independent errors for each step.
- Cap hint prompts and histories.

### Data Models

- `PracticeResponse`
- `RecordingResult`
- `LearnedWord`

### APIs

- `/api/transcribe`
- `/api/transform`
- `/api/tts`

### Validations

- Cannot transform empty transcript.
- Cannot save invalid word.
- Cannot submit while another request is in flight.
- Client should handle non-JSON error responses gracefully.

### Edge Cases

- User records successfully but transcription fails.
- User edits transcript after transcription.
- User starts a new practice while old audio is playing.
- User loses network connection.
- API route times out.
- Vercel serverless function cold start delay.

### Acceptance Criteria

- A judge can complete the main demo flow in under 2 minutes.
- The canonical demo sentence produces a useful transformation.
- User can save words from the result.
- TTS playback works or fails gracefully.
- Reset/new practice returns the screen to a clean state.

### Codex Prompt

Complete the full Satya-Vachan Practice flow by connecting recording, transcription, editable transcript, transformation, TTS playback, save-to-learned-words, recent history, retries, reset behavior, and elegant loading/error states. Preserve user input across failures and make the demo flow fast and clear.

## Module 11: Daily Challenge

### Objective

Implement the daily Word of the Day challenge as a mode of Practice with shared recording, transcription, AI validation, feedback, completion, and streak updates.

### Dependencies

- Module 10 complete.

### Requirements

- `/practice?challenge=today` shows a compact challenge banner with:
  - today's common-to-elevated word pair
  - one-line meaning
  - suggested sentence starters
  - completion state
- The shared Practice surface provides:
  - recorder and text fallback
  - editable transcript
  - feedback
  - streak update
- User task: use today's elevated word in their own sentence.
- The app should transcribe the sentence.
- The app should validate usage.
- Completion should update local streak only if usage is acceptable.
- If AI validation is unavailable, provide a local fallback:
  - check target word appears in transcript
  - accept if transcript length is reasonable
  - show conservative feedback

### UI Behavior

- Completed state should feel rewarding but not excessive.
- Show a small completion animation or badge.
- If already completed today, show completed state and allow optional re-practice without increasing streak.
- Provide helpful retry feedback if target word is missing.
- After a successful challenge, offer an optional action to refine the same sentence through the normal transform flow.

### Business Logic

- Use `/api/transcribe` for audio transcription.
- Create `/api/challenge/route.ts` for validation.
- Challenge route receives:
  - transcript
  - target word
  - word entry context
- Challenge route returns `ChallengeResponse`.
- Mark complete only when `acceptableUsage` is true.
- Add today's date to completed challenges.

### APIs

#### POST `/api/challenge`

Request:

```ts
{
  transcript: string;
  targetWord: string;
  wordEntry: WordEntry;
}
```

Success response:

```ts
ChallengeResponse
```

Error response:

```ts
{
  error: string;
  code: "EMPTY_TRANSCRIPT" | "MISSING_TARGET_WORD" | "MISSING_API_KEY" | "CHALLENGE_FAILED";
}
```

### Prompt Requirements

- Validate whether the user used the target word naturally.
- Accept romanized Hindi and Devanagari if either appears.
- Do not require perfect grammar.
- Provide short supportive feedback.
- Suggest a better version if usage is awkward.

### Validations

- Transcript must not be empty.
- Target word must not be empty.
- Do not increment streak twice in one day.
- If transcript lacks the target word, do not complete.

### Edge Cases

- User uses synonym instead of exact word.
- User mispronounces target word and transcript differs.
- User uses the word in a grammatically awkward way.
- Challenge already completed today.
- AI route fails.

### Acceptance Criteria

- User can complete a daily challenge.
- Successful completion updates streak on Home and Practice challenge mode.
- Re-completing same day does not increment streak again.
- User receives supportive feedback for failed attempts.
- Local fallback allows demo continuity if AI validation fails.

### Codex Prompt

Build the Daily Challenge mode at `/practice?challenge=today`. Show a compact word banner and starters above the one shared Practice recorder/input, validate target-word usage through `/api/challenge` with a local fallback, offer an optional elevation after success, and update local streak without double-counting the same day. Keep `/challenge` as a redirect only.

## Module 12: Learned Words and Personal Dictionary

### Objective

Complete the personal dictionary experience for saved vocabulary and simple follow-up practice.

### Dependencies

- Module 11 complete.

### Requirements

- Learned Words page shows:
  - saved words
  - meanings
  - simple alternatives
  - example sentences
  - saved date
  - source badge
  - remove action
  - practice action
- Include search/filter.
- Include filters by:
  - saved/source type if available
  - difficulty or tags if derived from corpus
- Show seed words for first-time users.
- Show saved count and small progress indicator.
- "Practice this word" should route to `/practice` or `/challenge` with prefilled context if practical.

### UI Behavior

- Use compact cards, not oversized marketing panels.
- Search should update immediately.
- Empty search state should explain no matches.
- Remove action should ask for lightweight confirmation or offer undo.
- Cards should handle long words and examples.

### Business Logic

- Read from learned words storage.
- Remove words by id.
- Search across word, meaning, simple alternative, and example.
- Sort by newest saved first, with seed words after saved words.
- If using query params for practice:
  - `/practice?word=prayas`
  - Practice page should show a contextual hint.

### Data Models

- `LearnedWord`

### APIs

- No server APIs required.

### Validations

- Search input should be trimmed.
- Remove action should not crash if id is missing.
- Avoid duplicate ids for seed words and saved words.

### Edge Cases

- No saved words.
- All words removed.
- Search returns no matches.
- Stored data contains invalid word objects.
- User has a large local list.

### Acceptance Criteria

- Learned Words page is useful with and without saved words.
- Search/filter works.
- User can remove saved words.
- Saved words from Practice and Challenge appear here.
- Page remains responsive on mobile.

### Codex Prompt

Complete the Learned Words personal dictionary. Display saved and seed vocabulary in elegant glass cards, add search/filter/sort, remove with safe UX, show saved counts and source badges, and optionally let users start practice from a selected word.

## Module 13: Validation, Error Handling, and Resilience

### Objective

Harden the full MVP so failures are understandable and the demo does not collapse when one service step fails.

### Dependencies

- Module 12 complete.

### Requirements

- Add shared validators in `/lib/validators.ts`.
- Normalize API error responses across all routes.
- Add client-side error display components.
- Handle:
  - missing OpenAI key
  - microphone denial
  - transcription failure
  - invalid AI JSON
  - TTS failure
  - network failure
  - localStorage failure
  - unsupported browser APIs
- Add fallback text input wherever audio is unavailable.
- Add demo-safe mock mode if no API key is present locally:
  - optional but useful for development
  - must not accidentally pretend to be AI in production unless clearly labeled

### UI Behavior

- Error messages should be supportive and action-oriented.
- Never erase user transcript due to downstream failures.
- Retry buttons should be close to the failed action.
- Use small status badges for offline/API states.

### Business Logic

- Centralize fetch handling.
- Apply request timeouts where appropriate.
- Validate response body before using it.
- Clamp and sanitize model-provided fields.
- Ensure all API routes return valid JSON on errors.

### Validations

- Transcript max length.
- TTS max length.
- Audio file size.
- Required env vars.
- PracticeResponse schema.
- ChallengeResponse schema.

### Edge Cases

- API returns HTML error page.
- User double-clicks submit.
- Slow Vercel cold start.
- Browser loses mic permission mid-flow.
- localStorage quota exceeded.

### Acceptance Criteria

- Every failure mode has a readable message and retry/recovery path.
- API routes do not expose secrets.
- Invalid model output does not crash the frontend.
- Demo can continue with typed input if microphone fails.

### Codex Prompt

Harden Satya-Vachan with shared validation, consistent API error responses, client-side error states, request guards, fallback text input, localStorage resilience, and graceful handling for microphone, OpenAI, network, TTS, and invalid JSON failures.

## Module 14: Animation, Gamification, and Visual Refinement

### Objective

Elevate the MVP into a refined, warm, softly layered, lightly gamified experience suitable for a hackathon demo.

### Dependencies

- Module 13 complete.

### Requirements

- Add motion to:
  - page transitions
  - card entrance
  - score increase
  - challenge completion
  - recording pulse
  - save word feedback
- Add gamified elements:
  - streak badge
  - learned words count
  - completion badge
  - score improvement indicator
- Keep animations fast and tasteful.
- Respect `prefers-reduced-motion`.
- Improve loading states:
  - transcription
  - transformation
  - TTS
  - challenge validation
- Improve empty states:
  - no saved words
  - no search results
  - no transcript yet

### UI Behavior

- Animations must not block task completion.
- No text overlap during animation.
- Soft translucent panels must remain readable on all supported backgrounds.
- Buttons should feel tactile with hover/press states.
- Do not use decorative elements that obscure content.

### Business Logic

- No major business logic changes.
- Motion should be based on state changes already present.

### Edge Cases

- Reduced motion mode.
- Low-performance mobile device.
- Long transformed sentences.
- Multiple loading states in sequence.

### Acceptance Criteria

- The app looks and feels like an elegant demo.
- The theme is clearly warm, refined, softly layered, and slightly gamified.
- Animations are smooth but restrained.
- Reduced motion users get a calmer experience.
- No layout shifts or overlapping UI during common flows.

### Codex Prompt

Refine Satya-Vachan's UI with warm soft surfaces, restrained borders and shadows, subtle animation, recording pulse, score movement, challenge completion feedback, save-word feedback, improved loading and empty states, and reduced-motion support. Keep the app refined, readable, responsive, and demo-ready.

## Module 15: Vercel Deployment Readiness

### Objective

Prepare the application for reliable Vercel deployment.

### Dependencies

- Module 14 complete.

### Requirements

- Ensure all OpenAI usage is server-side.
- Ensure `OPENAI_API_KEY` is read only from environment variables.
- Add `.env.example` with:

```text
OPENAI_API_KEY=
```

- Add README deployment instructions.
- Ensure no secrets are committed.
- Ensure route handlers are compatible with Vercel serverless runtime.
- Confirm package scripts:
  - `dev`
  - `build`
  - `start`
  - `lint`
- If using binary/audio APIs, verify response sizes are reasonable.

### UI Behavior

- If env var is missing in production, show a graceful "AI service unavailable" message in flows that need AI.
- Static screens should still work without API key.

### Business Logic

- Avoid using Node APIs unsupported by the selected runtime if route handlers specify Edge runtime.
- Prefer default Node.js runtime for OpenAI SDK compatibility unless intentionally configured otherwise.
- Keep API route response times reasonable for demo sentences.

### Validations

- Run type check.
- Run lint.
- Run production build.
- Test core flow locally if API key is available.
- Test typed fallback flow if microphone is unavailable.

### Edge Cases

- Vercel env var not configured.
- Serverless timeout during model response.
- Large audio upload.
- Browser blocks mic on deployed HTTPS domain due to permission settings.

### Acceptance Criteria

- `npm run build` succeeds.
- App can be deployed to Vercel.
- Required environment variables are documented.
- No OpenAI key is exposed to the browser bundle.
- Static home and localStorage features work even when AI is unavailable.

### Codex Prompt

Prepare Satya-Vachan for Vercel deployment. Add environment documentation, verify server-only OpenAI usage, harden missing-key behavior, ensure scripts/build/lint work, update README with deployment steps, and confirm the app remains usable for static/local features even if AI routes are unavailable.

## Module 16: Final Demo QA and Acceptance Pass

### Objective

Perform a final end-to-end pass to ensure the MVP meets the product idea and is ready for hackathon judging.

### Dependencies

- Module 15 complete.

### Requirements

- Test the core demo sentence:
  - "Humne is kaam ko jaldi khatam karne ki koshish ki."
- Expected natural elegant output should be close to:
  - "Humne is karya ko sheeghra samaapt karne ka prayas kiya."
- Expected elevated output should be close to:
  - "Humne is karya ko atishighra sampann karne ka gambhir prayatna kiya."
- Test full flow:
  - Home
  - Practice
  - Record or type
  - Transcribe
  - Transform
  - Listen
  - Save words
  - Learned Words
  - Daily Challenge mode within Practice
  - Streak update
- Test responsive layouts:
  - mobile width
  - tablet width
  - desktop width
- Test error cases:
  - no mic permission
  - no API key
  - empty transcript
  - TTS failure

### Acceptance Criteria

- Judge understands product within 30 seconds.
- Judge can experience core value within 2 minutes.
- Core demo flow is stable.
- UI is elegant, warm, softly layered, and lightly gamified.
- Feedback tone is supportive.
- No feature depends on authentication or database.
- Vercel deployment is documented and ready.

### Codex Prompt

Run a final QA pass on Satya-Vachan. Verify the canonical demo flow, localStorage persistence, Practice challenge-mode streak behavior, My Words, AI error handling, responsive layouts, warm soft-UI refinement, Vercel build readiness, and README deployment instructions. Fix any issues found without adding non-MVP scope.

## API Summary

### POST `/api/transcribe`

Purpose: Convert user audio into transcript text.

Request: multipart form data with `file`.

Response:

```ts
{
  transcript: string;
  durationMs?: number;
}
```

### POST `/api/transform`

Purpose: Convert transcript into elegant Hindi variants, scoring, feedback, and vocabulary explanations.

Request:

```ts
{
  transcript: string;
}
```

Response:

```ts
PracticeResponse
```

### POST `/api/tts`

Purpose: Generate audio for transformed Hindi text.

Request:

```ts
{
  text: string;
  variant?: "natural" | "elevated";
}
```

Response:

```ts
{
  audioBase64: string;
  mimeType: "audio/mpeg";
}
```

### POST `/api/challenge`

Purpose: Validate whether user used the Word of the Day correctly.

Request:

```ts
{
  transcript: string;
  targetWord: string;
  wordEntry: WordEntry;
}
```

Response:

```ts
ChallengeResponse
```

## MVP Non-Goals

Do not include these in the first implementation unless all MVP modules are complete:

- Authentication
- Database
- Payments
- Social sharing
- Leaderboards
- Full dictionary search beyond saved words
- Realtime voice conversation
- Advanced pronunciation scoring
- Multi-language support
- Admin dashboard
- Mobile native app
- Certificates

## Definition of Done

The MVP is done when Satya-Vachan lets a fluent Hindi speaker speak or type an ordinary Hindi sentence, receive two elegant Hindi transformations, understand the vocabulary improvements, hear the improved version, save useful words, complete a daily word challenge, and see local streak/progress in an elegant Vercel-ready web app.
