# Know Your Rights

An AI-powered legal awareness and decision-support application designed to help illiterate and semi-literate users understand their rights and take the correct actions in real-life situations.

---

## Overview

Many people lack access to legal knowledge due to illiteracy and complex legal language. This leads to exploitation, fraud, and poor decision-making.

Know Your Rights solves this by allowing users to:
- Describe their situation using voice or text
- Receive clear decisions and actions
- Understand relevant laws in simple language
- Get step-by-step guidance

---

## Key Features

- Voice and Text Input  
  Users can speak or type their problems  

- AI-Based Situation Analysis  
  Understands context and identifies issues  

- Decision Recommendation  
  Provides correct actions to take  

- Legal Mapping  
  Links situations to relevant laws/articles  

- Structured Output  
  - Problem Identified  
  - Correct Decision  
  - Reason  
  - Law/Article  
  - Next Steps  

- Optional Voice Output  
  Play audio only when user clicks  

- Multi-Language Support  
  Supports regional languages  

- Offline-First Design  
  Works in low or no internet conditions  

---

## Tech Stack

Frontend:
- React (TypeScript)
- Vite
- Tailwind CSS
- ShadCN UI  

Backend:
- Supabase (PostgreSQL + Edge Functions)

AI / NLP:
- Gemini API (for situation understanding and decision generation)

Voice Processing:
- Speech-to-Text API
- Text-to-Speech API  

---

## Project Structure

src/
  components/
  pages/
  hooks/
  lib/

integrations/
  supabase/

functions/
  legal-decision/

---

## How It Works

1. User enters a situation (voice or text)  
2. Voice input is converted to text (if needed)  
3. AI analyzes the situation  
4. System identifies the issue category  
5. Decision engine generates:
   - Correct action  
   - Reason  
   - Relevant law  
   - Next steps  
6. Output is displayed in text with optional voice playback  

---

## Installation & Setup

# Clone the repository
git clone <your-repo-link>

# Navigate to project
cd know-your-rights

# Install dependencies
npm install

# Start development server
npm run dev

---

## Deployment

You can deploy using:
- Lovable (recommended)
- Vercel
- Netlify  

---

## Future Enhancements

- Advanced AI models for better accuracy  
- Location-based legal assistance  
- Integration with government portals  
- Document upload and analysis  
- Real-time chatbot support  

---

## Impact

- Empowers users with legal knowledge  
- Reduces exploitation and fraud  
- Promotes digital and legal inclusion  
- Scalable across rural communities  

---

## Conclusion

Know Your Rights transforms complex legal information into simple, actionable decisions, making justice accessible to everyone regardless of literacy.

---

## License

This project is developed for educational and hackathon purposes.
