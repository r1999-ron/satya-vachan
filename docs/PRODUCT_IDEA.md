Application name: Satya-Vachan

Many Hindi speakers can communicate easily, but when they need to sound polished, cultured, eloquent, dignified or articulate, they struggle.

Word of the day 
a simple hindi word and its English meaning nad also a sentence with the simple word and elevated word
yaani -> thereby -> arthaarth

Along with the word of the data, put a challenge also where the user needs to use that word in some sentence and speak to the AI, maintain a streak in the local storage

aand also some paryavachi words which is can be commonly replaced without sounding very pedantic


Practice -> clicking on this button, user can speak some sentence in general
The AI will listen it and transcribe it and try to speak the same in an elegant hindi language -> it will give it 2 variants, one of them will be a basic transformation and the other a more transformed one (this will sound more pedantic). Both the text will come on the screen and the Ai will speak only the basic version of it. The user should have the option of listening to the other one also

For each sentence, information about the replaced word will also be shown. The user should have an option of adding it to his learnings (for now we can store it in local storage)

Word-by-word explanation
Shows what changed and why.

uesr gets an elegance score also along with the polished sentences with the AI

AI also checks for pronunciation (I think this should be in version 2 of the product)


Learn one elegant word
        ↓
Speak a normal sentence
        ↓
AI upgrades it
        ↓
User practices saying it
        ↓
AI gives score and correction
        ↓
User uses it in real life (as in tries to complete the challenge for the daily word by making a sentence there itself)
        ↓
App tracks progress



Tech Stack
Next.js (App Router) + TypeScript 
. for storing the words that he learnt in the dictionary -> for the demo purpose, we can store it in the local storage.
Do we really need a dedicated backend for this application

Browser MediaRecorder API
Data: a plain JSON/TS file in the repo for your curated ~60-word corpus. No database, no auth
Deploy with vercel
use OPEN_AI_API_KEY in the environment variable


GPT conversation flow
User speaks Hindi
      ↓
OpenAI speech-to-text transcribes it
      ↓
GPT model rewrites / scores / explains in elevated Hindi
      ↓
OpenAI text-to-speech speaks the improved sentence back




Dont use realtime voice conversation now -> use it only if you have enough time left before the submission. keep it in the version 2 of the product.

open Ai provides these APIs -> check which one we need for our use case


Speech-to-text
Use gpt-4o-transcribe, gpt-4o-mini-transcribe, or whisper-1.
These convert spoken audio into text. OpenAI’s docs list transcriptions and translations endpoints, with newer transcription models like gpt-4o-transcribe and gpt-4o-mini-transcribe.
Text-to-speech
Use gpt-4o-mini-tts, tts-1, or tts-1-hd.
These convert text into spoken audio. OpenAI’s docs recommend gpt-4o-mini-tts for intelligent real-time applications and allow control over tone, speed, accent, emotion, and intonation.
Real-time voice conversation
Use the Realtime API if you want a live voice agent where the user speaks and the AI responds quickly in voice.
OpenAI’s docs specifically recommend Realtime for low-latency voice agents, live transcription, translation, and speech generation.







the user experience should feel gamified, not very serious

usefulness -> people can speak good, flaunt their skills, useful for teachers, poets, hobbyists, offers people skills to read hindi literature, learn beautiful hindi for personal interest



No DB/Auth
No Raltime voice API -> record → transcribe → respond → speak






Future scope -> include a hindi dictionary in the application


Some challenges that needs to be addressed

For the Demo purpose, we need to collected some words to be shown in the daily word place. Also some sentences which we can hint the user to try sincce he may not be able to think of some sentence right then and there

Load some words in the learned word section for every user in the dictionary as a seed so that things are populated by default also, helps in the demo

the examples shown should not be too archiac words. Choose good decent examples

Bad Example:
Yeh photo acchi hai.
Yah chhayaachitra atyant sundar hai.

Good Example
Humne is kaam ko jaldi khatam karne ki koshish ki.
Humne is karya ko sheeghra khatam karne ka prayas kiya.

