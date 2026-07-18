# Satya-Vachan — Product Idea and MVP Specification

## 1. Product Summary

**Satya-Vachan** is an AI-powered Hindi speaking coach for people who already speak Hindi but want to sound more elegant, articulate, cultured, and eloquent.

The app does **not** teach Hindi from scratch. Instead, it helps fluent Hindi speakers upgrade their everyday Hindi into a more refined register through daily vocabulary, speech practice, AI-powered sentence transformation, and light gamification.

In simple terms:

> The user speaks normal Hindi.  
> The AI transforms it into better Hindi.  
> The user listens, learns, practices, and gradually builds a richer vocabulary.

---

## 2. Target Users

Satya-Vachan is useful for people who already know Hindi but want to speak it better.

Primary users:

- Hindi content creators
- Teachers
- Poets and writers
- Public speakers
- UPSC and state exam aspirants
- Hindi-medium interview candidates
- Hobbyists who enjoy beautiful Hindi
- People who want to read and appreciate Hindi literature better
- Anyone who wants to speak elegant Hindi without sounding artificial or overly pedantic

---

## 3. Core User Problem

Many Hindi speakers can communicate easily in daily life, but struggle when they need to sound:

- elegant
- dignified
- eloquent
- cultured
- articulate
- literary, but still natural

Example:

A user may naturally say:

> Humne is kaam ko jaldi khatam karne ki koshish ki.

A more elegant version could be:

> Humne is karya ko sheeghra samaapt karne ka prayas kiya.

The goal is not to make the user sound archaic or unnatural. The goal is to help them replace common words with better, more expressive words where appropriate.

---

## 4. Product Philosophy

Satya-Vachan should feel useful, playful, and aspirational.

It should **not** feel like a strict grammar classroom.

The product should avoid shaming users for using simple Hindi, English-mixed Hindi, or conversational Hindi. The framing should always be:

> “Here is a more elegant way to say this.”

Not:

> “Your Hindi is wrong.”

The app should help the user acquire linguistic confidence, not linguistic insecurity.

---

## 5. Main Product Loop

The core loop of the app is:

```text
Learn one elegant word
        ↓
Speak a normal Hindi sentence
        ↓
AI upgrades it into elegant Hindi
        ↓
User listens to the improved version
        ↓
User reviews word-by-word explanation
        ↓
User optionally saves useful words
        ↓
User completes a daily word challenge
        ↓
App tracks streak and progress locally
```

This loop should be visible in the product experience.

---

## 6. MVP Goal

The hackathon MVP should prove one main idea:

> Can AI help a fluent Hindi speaker instantly transform ordinary Hindi into more elegant Hindi and make the process feel useful and fun?

The MVP should focus on a strong demo experience, not a full production-grade learning platform.

---

## 7. MVP Features

### 7.1 Home Page

The home page should show:

- App name: **Satya-Vachan**
- Short tagline
- Today’s word
- Current streak
- Quick actions:
  - Practice
  - Daily Challenge
  - Learned Words

Suggested tagline:

> Speak Hindi with clarity, grace, and confidence.

Alternative tagline:

> Turn everyday Hindi into eloquent expression.

---

### 7.2 Word of the Day

Every day, the app shows one useful elevated Hindi word.

Each word entry should include:

- Simple word or common expression
- Elevated Hindi replacement
- English meaning
- Simple example sentence
- Elevated example sentence
- A few commonly usable synonyms
- Usage note explaining when to use it
- Challenge prompt for the user

Example:

```text
Common: yaani
Elevated: arthaat
English meaning: that is / in other words / thereby

Simple sentence:
Yaani humein ab naya tareeka chahiye.

Elevated sentence:
Arthaat humein ab ek nayi paddhati ki avashyakta hai.

Usage note:
Use “arthaat” when explaining or clarifying something. It sounds elegant but still natural.

Related words:
isliye, tatparya, nihitaarth
```

Important: Examples should be elegant but not too archaic. Avoid words that make the app feel like a dusty dictionary with a superiority complex.

---

### 7.3 Daily Challenge

Along with the Word of the Day, the app should give the user a small speaking challenge.

Example:

> Use the word “arthaat” in your own sentence and speak it to the AI.

The app should:

- Let the user record a sentence
- Transcribe the sentence
- Check whether the user used the target word correctly
- Give short feedback
- Mark the challenge as complete if the usage is acceptable
- Maintain a streak in local storage

For the hackathon demo, this can be simple and local-only.

Streak data can be stored in `localStorage`.

Example local storage fields:

```ts
{
  currentStreak: number;
  lastCompletedDate: string;
  completedChallenges: string[];
}
```

---

### 7.4 Practice Mode

Practice Mode is the core feature.

The user clicks a **Practice** button and speaks any Hindi sentence naturally.

Flow:

```text
User records Hindi sentence
        ↓
Audio is sent for speech-to-text transcription
        ↓
AI receives the transcript
        ↓
AI generates two elegant Hindi versions
        ↓
AI gives elegance score and explanation
        ↓
App speaks the basic elegant version using text-to-speech
        ↓
User can optionally listen to the more elevated version
```

The app should show:

1. Original transcript
2. Basic elegant version
3. More elevated version
4. Elegance score
5. Word-by-word explanation
6. Option to save useful words
7. Audio playback for both elegant versions

---

### 7.5 Two Transformation Variants

For every user sentence, the AI should generate two transformed versions.

#### Variant 1: Natural Elegant Hindi

This version should sound better than the original but still usable in normal speech.

Example:

Original:

> Humne is kaam ko jaldi khatam karne ki koshish ki.

Natural elegant version:

> Humne is karya ko sheeghra samaapt karne ka prayas kiya.

This is the version the AI should automatically speak back.

#### Variant 2: More Elevated Hindi

This version can be more literary, formal, or Sanskritized.

Example:

Original:

> Humne is kaam ko jaldi khatam karne ki koshish ki.

More elevated version:

> Humne is karya ko atishighra sampann karne ka gambhir prayatna kiya.

This version should be available, but should not be forced as the default because it may sound too formal in daily use.

---

### 7.6 Word-by-Word Explanation

For each transformed sentence, the app should explain what changed and why.

Example:

```text
Original word: kaam
Replacement: karya
Why: “Karya” sounds more formal and elegant than “kaam.”

Original word: jaldi
Replacement: sheeghra
Why: “Sheeghra” means quickly or soon and has a more refined tone.

Original word: koshish
Replacement: prayas
Why: “Prayas” is a more elegant Hindi word for attempt or effort.
```

This is important because the user should learn reusable vocabulary, not just receive one-time rewrites.

---

### 7.7 Elegance Score

After transforming the sentence, the AI should provide an elegance score.

Example:

```text
Original Elegance Score: 42/100
Improved Elegance Score: 78/100

Feedback:
Your original sentence was clear but conversational. The improved version uses more precise and elegant words such as “karya,” “sheeghra,” and “prayas.”
```

The score is mainly for gamification and user delight. It does not need to be linguistically perfect in the MVP, but it should feel consistent and explainable.

Suggested scoring dimensions:

- Vocabulary richness
- Naturalness
- Clarity
- Register elevation
- Avoidance of excessive pedantry

---

### 7.8 Save to Learned Words

The user should be able to save useful replacement words from the explanation.

Example:

- karya
- sheeghra
- prayas
- arthaat
- nihitaarth

For the MVP, learned words can be stored in local storage.

Suggested local storage format:

```ts
type LearnedWord = {
  id: string;
  word: string;
  meaning: string;
  simpleAlternative?: string;
  exampleSentence: string;
  savedAt: string;
};
```

No database is required for the hackathon demo.

---

### 7.9 Learned Words / Personal Dictionary

The app should include a simple **Learned Words** section.

This section shows:

- Words saved by the user
- Meaning
- Example usage
- Date saved
- Optional “practice this word” action

For demo purposes, seed this section with a few default words so the screen does not look empty for a new user.

Example seed words:

```text
karya
prayas
sheeghra
arthaat
uchit
samuchit
vichaar
drishtikon
nihitaarth
saar
```

---

### 7.10 Hint Sentences for Demo

In the demo, users may not immediately think of sentences to speak. The app should provide a few tappable hint prompts.

Examples:

```text
Humne is kaam ko jaldi khatam karne ki koshish ki.
Mujhe is baat ka matlab samajh nahi aaya.
Aaj office mein bahut confusion tha.
Yeh faisla mere liye important hai.
Mujhe lagta hai ki yeh idea accha hai.
Is topic par logon ki alag-alag rai hai.
```

These should help judges quickly test the product.

---

## 8. Recommended MVP Screens

### Screen 1: Home

Purpose:

- Establish what the app does
- Show Word of the Day
- Show streak
- Route user to main actions

Components:

- App name and tagline
- Word of the Day card
- Daily challenge card
- Current streak
- Practice button
- Learned Words button

---

### Screen 2: Practice

Purpose:

- Let user record a sentence
- Show AI transformation

Components:

- Record button
- Audio recording state
- Transcribed text
- Basic elegant version
- More elevated version
- Elegance score
- Word explanation cards
- Save word buttons
- Listen buttons

---

### Screen 3: Daily Challenge

Purpose:

- Make the Word of the Day actionable

Components:

- Today’s word
- Challenge instruction
- Suggested sentence starters
- Record button
- AI feedback
- Complete challenge button
- Streak update

---

### Screen 4: Learned Words

Purpose:

- Show user’s growing personal vocabulary

Components:

- List of saved words
- Meaning
- Example sentence
- Simple replacement word
- Practice again button

---

## 9. OpenAI API Usage

The MVP should use a request-based audio flow, not realtime voice.

### Recommended MVP Flow

```text
User speaks Hindi
      ↓
Browser records audio using MediaRecorder API
      ↓
Audio file is sent to a Next.js API route
      ↓
OpenAI speech-to-text transcribes the audio
      ↓
GPT model rewrites, scores, and explains the sentence
      ↓
OpenAI text-to-speech generates audio for the elegant version
      ↓
Frontend displays text and plays audio
```

### Speech-to-Text

Use one of:

- `gpt-4o-transcribe`
- `gpt-4o-mini-transcribe`
- `whisper-1`

Recommended for MVP:

```text
gpt-4o-mini-transcribe
```

Reason:

- Good enough for demo use
- Likely cheaper than larger transcription models
- Suitable for short user-recorded sentences

Use `gpt-4o-transcribe` if transcription quality is noticeably better for Hindi during testing.

---

### Text Generation / Transformation

Use a GPT model to produce structured JSON containing:

- original transcript
- natural elegant Hindi version
- more elevated Hindi version
- English explanation
- word replacements
- elegance score
- feedback
- words that can be saved

The model should be instructed to avoid overly archaic words unless generating the “more elevated” variant.

Expected JSON shape:

```ts
type PracticeResponse = {
  transcript: string;
  naturalElegantVersion: string;
  elevatedVersion: string;
  originalEleganceScore: number;
  improvedEleganceScore: number;
  feedback: string;
  replacements: {
    original: string;
    replacement: string;
    meaning: string;
    whyBetter: string;
    naturalness: "common" | "formal" | "literary";
  }[];
};
```

---

### Text-to-Speech

Use:

```text
gpt-4o-mini-tts
```

The app should generate speech for the natural elegant version by default.

The user should also have a button to listen to the more elevated version.

Voice instructions should ask for:

- clear Hindi pronunciation
- calm teacher-like tone
- natural pacing
- no excessive dramatization
- correct handling of Sanskritized Hindi words

Example TTS instruction:

```text
Speak in clear, elegant Hindi with a calm teacher-like tone. Pronounce Sanskritized Hindi words carefully. Keep the delivery natural, not theatrical.
```

---

### Realtime Voice API

Do **not** use the Realtime API in the MVP unless everything else is complete.

Realtime voice should be treated as a Version 2 feature.

Reason:

- More complex integration
- More moving parts
- Not necessary for a strong hackathon demo
- Request-based flow is simpler and easier to debug

---

## 10. Tech Stack

### Frontend

Use:

```text
Next.js App Router + TypeScript
```

Suggested UI stack:

- Tailwind CSS
- shadcn/ui or simple custom components
- Framer Motion only if time permits

The app should feel modern, light, and slightly gamified.

---

### Backend

A separate backend is **not required** for the MVP.

Use Next.js API routes / route handlers for:

- speech-to-text
- GPT transformation
- text-to-speech

Reason:

- Faster implementation
- Easier deployment on Vercel
- No database/auth complexity
- Keeps the hackathon build lean

Suggested structure:

```text
/app
  /page.tsx
  /practice/page.tsx
  /challenge/page.tsx
  /learned/page.tsx

/app/api
  /transcribe/route.ts
  /transform/route.ts
  /tts/route.ts

/lib
  /openai.ts
  /storage.ts
  /prompts.ts

/data
  /words.ts

/types
  /index.ts
```

---

### Audio Recording

Use the browser `MediaRecorder` API.

Flow:

```text
Start recording
Stop recording
Convert recording to Blob/File
Send to /api/transcribe
Receive transcript
Send transcript to /api/transform
Receive structured transformation
Send elegant text to /api/tts
Play returned audio
```

---

### Data Storage

For MVP:

- No database
- No authentication
- No user accounts

Use:

- static TypeScript/JSON file for curated word corpus
- local storage for streaks
- local storage for learned words
- local storage for completed daily challenges

Suggested corpus file:

```text
/data/words.ts
```

Suggested number of curated words for demo:

```text
50–60 words
```

This is enough for the hackathon.

---

### Environment Variables

Use:

```text
OPENAI_API_KEY
```

Store it in Vercel environment variables.

Never expose the OpenAI API key in frontend code.

All OpenAI calls should happen inside server-side API routes.

---

### Deployment

Use:

```text
Vercel
```

Reasons:

- Simple deployment for Next.js
- Easy environment variable setup
- Good enough for online hackathon submission

---

## 11. Suggested Curated Word Corpus

The examples should be elegant but not absurdly archaic.

Good replacements:

```text
kaam → karya
koshish → prayas
jaldi → sheeghra
matlab → arth
yaani → arthaat
soch → vichaar
nazariya → drishtikon
sahi → uchit
bahut → atyadhik
zaroori → avashyak
madad → sahayata
gussa → rosh
dukh → vishaad
khushi → anand
tareeka → paddhati
baat → kathan / vichaar
problem → samasya
solution → samadhan
important → mahatvapurna
clear → spasht
confusion → aspashtata
```

Avoid overdoing examples like:

```text
photo → chhayaachitra
```

This is technically interesting but may sound too forced in normal speech. Use it sparingly, not as the default style.

Good example:

```text
Original:
Humne is kaam ko jaldi khatam karne ki koshish ki.

Better:
Humne is karya ko sheeghra samaapt karne ka prayas kiya.
```

Bad demo example:

```text
Original:
Yeh photo acchi hai.

Better:
Yah chhayaachitra atyant sundar hai.
```

Reason:

- It feels too artificial for daily speech.
- It risks making the product look like a parody of shuddh Hindi.
- The app should sound elevated, not comically over-Sanskritized.

---

## 12. Prompting Guidelines for AI

The transformation prompt should enforce the following:

### The AI should:

- Understand the user's Hindi sentence
- Preserve the original meaning
- Improve the register
- Generate natural elegant Hindi
- Generate one more elevated version
- Avoid unnecessary archaism
- Explain word replacements simply
- Score the sentence consistently
- Return structured JSON

### The AI should not:

- Make the sentence too long
- Change the user's intent
- Use obscure words where common elegant words are better
- Convert every English word mechanically
- Produce Sanskritized Hindi that sounds unnatural
- Shame the user for ordinary Hindi

### System Prompt Concept

```text
You are Satya-Vachan, an AI Hindi expression coach.

Your job is to help fluent Hindi speakers express the same idea in more elegant, clear, and expressive Hindi.

Always preserve the user's meaning. Produce two versions:
1. Natural elegant Hindi: refined but usable in normal speech.
2. More elevated Hindi: more formal, literary, or Sanskritized, but still grammatically correct.

Avoid making the Hindi comically archaic. Prefer words that an educated Hindi speaker could realistically use.

Return only valid JSON matching the requested schema.
```

---

## 13. Gamification

The experience should feel lightly gamified.

Use:

- Daily streak
- Word of the Day
- Daily challenge
- Elegance score
- Saved words count
- Progress cards
- Completion badges if time permits

Avoid:

- Too many points systems
- Complex leaderboards
- Heavy avatars
- Long onboarding

The product should feel like an elegant learning tool, not a cartoon language game.

---

## 14. Version 2 Features

These should not be part of the core hackathon MVP unless extra time is available.

### Pronunciation Scoring

The AI checks whether the user pronounced target words correctly.

This is valuable, especially for Sanskritized words, but can be deferred.

Possible flow:

```text
User listens to elegant sentence
        ↓
User repeats it
        ↓
AI compares transcript or phonetic similarity
        ↓
AI gives pronunciation feedback
```

---

### Realtime Voice Conversation

A live AI conversation partner that speaks with the user in real time.

Possible modes:

- UPSC interview practice
- News anchor practice
- Teacher mode
- Debate mode
- Poetry/literary discussion mode

This would be impressive, but it is not required for the first demo.

---

### Full Hindi Dictionary

A larger searchable dictionary of elegant Hindi words.

Fields:

- word
- meaning
- simple equivalent
- example usage
- synonyms
- register level
- tags
- difficulty

---

### User Accounts and Sync

Add authentication and database later if the product grows.

Possible future stack:

- Supabase Auth
- Supabase Postgres
- User progress sync
- Saved vocabulary across devices

---

### Spaced Repetition

Resurface saved words based on usage.

Example:

- New word appears again after 1 day
- Then after 3 days
- Then after 7 days
- Then after 14 days

This would make the learning loop stronger, but it is not needed for the hackathon MVP.

---

## 15. Non-Goals for MVP

Do not build these in the hackathon MVP:

- Full authentication
- Database
- Payment/subscription
- Social sharing
- Realtime voice chat
- Complex pronunciation scoring
- Multi-language support
- Large dictionary
- Admin dashboard
- Mobile app
- Institutional/B2B features
- Certificates
- Leaderboards

These are distractions for the demo.

---

## 16. Demo Strategy

The demo should focus on one impressive moment:

> A user speaks ordinary Hindi, and the app instantly turns it into elegant Hindi with explanation, score, and audio playback.

Best demo sentence:

```text
Humne is kaam ko jaldi khatam karne ki koshish ki.
```

Expected output:

```text
Natural elegant:
Humne is karya ko sheeghra samaapt karne ka prayas kiya.

More elevated:
Humne is karya ko atishighra sampann karne ka gambhir prayatna kiya.
```

Show:

- Transcript
- Two versions
- Score improvement
- Word replacements
- Audio playback
- Save word
- Challenge completion
- Streak update

This is enough to explain the product clearly.

---

## 17. Success Criteria for Hackathon MVP

The MVP is successful if a judge can understand the product within 30 seconds and experience the core value within 2 minutes.

A good demo should make the judge think:

> “I spoke a normal sentence, and the app made me sound better immediately.”

That is the product’s core magic.

---

## 18. Build Priority

### Priority 1 — Must Build

- Home screen
- Word of the Day
- Practice mode
- Speech recording
- Speech-to-text
- AI sentence transformation
- Two rewritten variants
- Elegance score
- Word-by-word explanation
- TTS playback
- Learned words using local storage
- Daily challenge using local storage

### Priority 2 — Should Build

- Seed learned words
- Hint sentences
- Better loading states
- Beautiful UI animations
- Streak card
- Clear demo data

### Priority 3 — Nice to Have

- Challenge validation by AI
- Shareable result card
- Basic pronunciation retry mode
- Roleplay mode
- Theme-based word categories

---

## 19. Recommended Development Sequence

### Step 1: Static UI

Build the screens first with mock data:

- Home
- Practice
- Challenge
- Learned Words

### Step 2: Word Corpus

Create `/data/words.ts` with 50–60 curated words.

### Step 3: Local Storage

Implement:

- streak
- learned words
- completed challenge state

### Step 4: Recording

Add MediaRecorder support.

### Step 5: OpenAI API Routes

Add:

- `/api/transcribe`
- `/api/transform`
- `/api/tts`

### Step 6: Connect Full Flow

Connect:

```text
Record → Transcribe → Transform → Speak → Save Words
```

### Step 7: Refine Demo

Add:

- loading states
- error handling
- default hint sentences
- seeded learned words
- responsive layout
- better empty states

---

## 20. Product Positioning

One-line pitch:

> Satya-Vachan is an AI speaking coach that helps fluent Hindi speakers turn everyday Hindi into elegant, eloquent Hindi through speech practice, daily vocabulary, and instant AI feedback.

Short pitch:

> Most Hindi speakers can communicate, but many struggle to sound elegant when speaking formally. Satya-Vachan helps users practice elegant Hindi by transforming their spoken sentences into refined Hindi, explaining better word choices, and helping them build a personal vocabulary through daily challenges.

Hackathon pitch:

> Satya-Vachan uses OpenAI speech-to-text, language generation, and text-to-speech to create an interactive Hindi expression coach. Users speak naturally, the AI rewrites their sentence into elegant Hindi, explains the improvement, scores the expression, and speaks it back. The result is a practical, gamified way to build articulate Hindi speaking skills.

---

## 21. Key Design Principle

The app should make the user feel:

> “I already know Hindi. This app is helping me express myself better.”

Not:

> “I am bad at Hindi.”

This distinction matters. The product should be aspirational, not corrective.
