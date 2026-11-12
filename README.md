<div align="center">

# 🌼 MindBloom

### *Breathe. Reflect. Thrive.*

**A warm, interactive mental wellness companion for students, powered by a machine learning model.**
https://github.com/aadyeah/MindBloom-Mental-Wellness

![HTML5](https://img.shields.io/badge/HTML5-D4AF37?style=for-the-badge&logo=html5&logoColor=28251F)
![CSS3](https://img.shields.io/badge/CSS3-CE8946?style=for-the-badge&logo=css3&logoColor=FFFEF8)
![JavaScript](https://img.shields.io/badge/JavaScript-BDB76B?style=for-the-badge&logo=javascript&logoColor=28251F)
![FastAPI](https://img.shields.io/badge/FastAPI-28251F?style=for-the-badge&logo=fastapi&logoColor=D4AF37)
![scikit-learn](https://img.shields.io/badge/scikit--learn-777365?style=for-the-badge&logo=scikitlearn&logoColor=FFFEF8)

*No frameworks. No build step. Just open it and bloom.*

</div>

---

## ✨ What is MindBloom?

MindBloom turns a questionnaire into a conversation. A friendly student character welcomes you, explains why mental wellbeing matters in college life, and guides you through a short, gentle check-in about your everyday habits: sleep, study, social media, movement and stress.

At the end, your answers are sent to a trained ML model, and you receive an **experimental wellness estimate** with a few kind, practical ideas to try.

> 💛 **This is not a diagnosis.** The score is an experimental estimate from a student project. It is not a medical tool and no substitute for professional mental health support.

---

## 🗺️ The Journey

| Step | Screen | What happens |
|:---:|---|---|
| 1 | **Welcome** | Your wellness buddy waves hello and invites you in. |
| 2 | **Understand** | Five short, conversational slides on mental health, student life, stress, sleep, movement and social media. |
| 3 | **Choose** | Pick **🎙️ Let's Talk** (voice) or **📋 I'll Type My Answers** (manual). Both ask the same 12 questions. |
| 4 | **Check in** | One question at a time, with a progress bar, speech bubble and encouragement. |
| 5 | **Reflect** | An animated score ring, a summary of your answers and gentle wellness ideas. |

---

## 🌟 Features

- 🎨 **Warm editorial design** with a golden, cream and caramel palette, rounded cards and soft motion.
- 🧑‍🎓 **A reusable SVG mascot** with seven expressions: waving, smiling, explaining, thinking, listening, encouraging and celebrating.
- 🎙️ **Working voice assessment** using the browser's Web Speech API. Speak your answer, review it, edit it and confirm.
- 🧠 **Smart answer mapping:** "I sleep around seven hours" becomes `7`, and "quite high" becomes `High`.
- ✅ **Validation before every step**, with friendly messages. Nothing is silently accepted.
- 🔌 **Live FastAPI integration.** The score always comes from your real model, never from mock data.
- ♿ **Accessible by default:** keyboard navigation, visible focus, ARIA labels and `prefers-reduced-motion` support.
- 📱 **Fully responsive** for desktop, tablet and mobile.

---

## 🚀 Getting Started

### 1. Start the backend

```bash
pip install fastapi uvicorn joblib pandas scikit-learn
uvicorn main:app --reload
```

Make sure `Mental_Health_Model.pkl` sits next to `main.py`. The API runs at `http://127.0.0.1:8000`.

### 2. Start the frontend

Keep these three files together in one folder:

```
index.html   style.css   app.js
```

Serve the folder, which is the most reliable way to get microphone access:

```bash
python -m http.server 5500
```

Then open **http://localhost:5500** in **Chrome** or **Edge**.

### 3. Point to a different backend (optional)

Edit the first config line in `app.js`:

```js
const API_URL = (window.MINDBLOOM_API_URL || 'http://127.0.0.1:8000')
```

---

## 🔌 API Contract

**`POST /predict`**

```json
{
  "age": 19,
  "gender": "Female",
  "country": "India",
  "academic_level": "Undergraduate",
  "most_used_platform": "Instagram",
  "purpose_of_use": "Entertainment",
  "avg_daily_usage_hours": 4.5,
  "daily_unlocks": 65,
  "study_hours": 5,
  "physical_activity_hours": 1,
  "sleep_hours_per_night": 7,
  "stress_level": "Medium"
}
```

**Response**

```json
{ "predicted_mental_health_score": 6.78 }
```

### The 12 fields

| Field | Type | Allowed values |
|---|---|---|
| `age` | integer | 10 to 100 |
| `gender` | string | `Male`, `Female` |
| `country` | string | Any country name |
| `academic_level` | string | `Undergraduate`, `Graduate`, `High School` |
| `most_used_platform` | string | Facebook, LinkedIn, Instagram, Snapchat, Twitter, YouTube, TikTok, LINE, KakaoTalk, VKontakte, WhatsApp, WeChat |
| `purpose_of_use` | string | `Networking`, `Education`, `Entertainment`, `News` |
| `avg_daily_usage_hours` | float | 0 to 24 |
| `daily_unlocks` | integer | 0 or more |
| `study_hours` | float | 0 to 24 |
| `physical_activity_hours` | float | 0 to 24 |
| `sleep_hours_per_night` | float | 0 to 24 |
| `stress_level` | string | `Low`, `Medium`, `High`, `Very High` |

---

## 🎙️ Voice Mode

1. The character reads the question aloud.
2. Tap the mic. A pulsing animation shows the microphone is live.
3. Speak naturally. Live text appears as you talk.
4. Your answer is interpreted and filled into the field for you to **review or edit**.
5. Tap **Confirm & continue**.

| You say | It becomes |
|---|---|
| "I sleep for around seven hours" | `sleep_hours_per_night: 7` |
| "An hour and a half" | `1.5` |
| "My stress is quite high" | `stress_level: High` |
| "Mostly YouTube" | `most_used_platform: YouTube` |
| "I'm in the UK" | `country: UK` |

If the app can't match what it heard, it says so and asks you to try again or choose manually.

**Browser support:** speech recognition works in Chrome and Edge and needs an internet connection. In other browsers, voice mode falls back to typing.

> The companion is a guided, scripted character. It is **not** a conversational AI or LLM.

---

## 🛡️ Responsible by Design

- The score is shown as an **estimate**, with a clear disclaimer on the results screen.
- **No invented thresholds or risk categories.** The app never labels anyone as healthy, anxious or depressed. The ring uses a 0 to 10 axis for visual reference only.
- The wellness tips are general habit suggestions, not derived from the model.
- The model currently accepts only **Male** or **Female**. The app says so openly and respectfully.

**Before publishing,** confirm what the target score means in your training data (scale and direction), then set `AXIS_MAX` in `app.js` and update the results wording accordingly.

---

## 📁 Project Structure

```
mindbloom/
├── index.html   # Page shell and font loading
├── style.css    # Design system: palette, cards, motion, responsive rules
└── app.js       # Screens, character, voice parsing, validation, API call
```

## 🎨 Design Tokens

| Token | Hex |
|---|---|
| Golden Yellow | `#D4AF37` |
| Olive Taupe | `#BDB76B` |
| Soft Cream | `#FDFBD4` |
| Warm Caramel | `#CE8946` |
| Warm Ivory | `#FFFEF8` |
| Ink | `#28251F` |
| Muted | `#777365` |
| Border | `#E9E4D5` |

**Fonts:** Playfair Display for headings, Manrope for body text and Caveat for the speech bubbles.

---

## 🧩 Customising

- **Edit questions or wording:** the `Q` array in `app.js`.
- **Add education slides:** the `SLIDES` array.
- **Tweak voice recognition:** the parser functions near the top of `app.js`.
- **Change the look:** the CSS variables at the top of `style.css`.

---

## 🐛 Troubleshooting

| Problem | Try this |
|---|---|
| "I couldn't reach the prediction server" | Check that `uvicorn main:app --reload` is running and `API_URL` matches. |
| Microphone does nothing | Use Chrome or Edge, serve over `localhost`, and allow mic access from the lock icon. |
| Voice isn't offered | Your browser doesn't support speech recognition. Type your answers instead. |
| "The server didn't accept one of the answers" | Go back and check the numbers are within the allowed ranges. |

---

<div align="center">

**A student mental wellness project** 🌼

*You've got this.* 💛

</div>
