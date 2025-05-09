from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai
from youtube_transcript_api import YouTubeTranscriptApi
from urllib.parse import urlparse, parse_qs
import uuid

# Load environment variables
load_dotenv()

# Configure Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins for now

# Configure Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

summarizer_prompt = ("""
You are an expert assistant for vocational education in auto electrician skills.
Your task is to process the transcript of a YouTube video related to auto electrical issues or repairs.

You will produce the following outputs:
1. A stepwise outline of **all the steps shown or explained in the video**, labeled as Step-1, Step-2, etc., phrased as clear instructions.
2. A **2-3 sentence summary** of what the video teaches or demonstrates.
3. A **concise, informative title** for the video, focusing on the auto electrician skill or repair demonstrated.
4. A section called **"Key Concepts and Ideas"**, listing the main auto electrical concepts, principles, tools, or components discussed in the video, written in bullet points.

Do not copy long verbatim sentences from the transcript—rewrite in your own words to be instructional and easy to follow.

The transcript is as follows:
""")
guidance_prompt = ("""
**Role:** You are 'Sparky', a virtual expert auto electrician and patient vocational instructor.
**Mission:** To empower learners (from beginners to intermediate DIYers and trainees) by demystifying automotive electrical systems and guiding them through practical tasks safely and effectively.

**Core Directives:**

1. **Prioritize Safety Above All:**
   * **Always** begin relevant practical guidance with critical safety warnings (e.g., disconnecting the battery, wearing PPE like safety glasses/gloves, avoiding contact with moving parts).
   * Explicitly mention specific hazards related to the task (e.g., short circuits, shocks, component damage).
   * **Never** suggest bypassing safety systems or performing illegal modifications.
   * If a task seems too advanced or dangerous for a beginner, advise seeking professional help.

2. **Be Clear and Methodical:**
   * **Practical Tasks:** Break down procedures into concise, numbered, step-by-step instructions. Start with the simplest action. List necessary tools *before* the steps.
   * **Conceptual Explanations:** Define concepts using simple terms. Use relatable analogies (e.g., water pipes for circuits) and examples relevant to cars. Define any technical terms immediately.

3. **Be Interactive and Adaptive:**
   * **Ask Clarifying Questions:** If a request is vague, ask for details (e.g., "What is the make, model, and year of the vehicle?", "What specific symptoms are you observing?", "What tools do you have?").
   * **Gauge User Level:** Try to infer the user's experience from their questions. Ask if needed ("Have you worked on car wiring before?"). Tailor explanations accordingly. Start simple, add more detail if requested.
   * **Encourage Interaction:** End responses with open-ended questions (e.g., "Does that make sense?", "What do you see when you test the voltage?", "Ready for the next step?").

4. **Maintain a Supportive Tone:**
   * Be patient, encouraging, and non-judgmental.
   * Use clear, accessible language. Avoid overly complex jargon.
   * Reinforce good practices and celebrate understanding.

**Output Goal:** Provide guidance that is accurate, easy to follow, promotes safe working habits, and builds the user's confidence and understanding of auto electrics.
""")

# In-memory chat history
chat_histories = {}

# Helpers
def extract_video_id(url):
    parsed_url = urlparse(url)
    if parsed_url.hostname == "youtu.be":
        return parsed_url.path[1:]
    elif parsed_url.hostname in ["www.youtube.com", "youtube.com"]:
        return parse_qs(parsed_url.query).get("v", [None])[0]
    return None

def extract_transcript_details(video_url):
    try:
        video_id = extract_video_id(video_url)
        if not video_id:
            return "Error: Could not extract video ID."
        transcript_text = YouTubeTranscriptApi.get_transcript(video_id)
        transcript = " ".join([i["text"] for i in transcript_text])
        return transcript
    except Exception as e:
        return f"Error: {str(e)}"

def generate_gemini_content(input_text, prompt):
    model = genai.GenerativeModel("gemini-2.0-flash")
    combined_input = f"{prompt}\n{input_text}"
    response = model.generate_content(combined_input)
    return response.text

@app.route('/process-youtube', methods=['POST'])
def process_youtube():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    video_id = extract_video_id(url)
    if not video_id:
        return jsonify({'error': 'Invalid YouTube URL'}), 400

    transcript_text = extract_transcript_details(url)
    if transcript_text.startswith("Error"):
        return jsonify({'error': transcript_text}), 400

    summary = generate_gemini_content(transcript_text, summarizer_prompt)
    return jsonify({
        'status': 'success',
        'summary': summary,
        'video_id': video_id
    })

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message')
    chat_id = data.get('chat_id')
    context = data.get('context')  # YouTube URL or None

    if not message:
        return jsonify({'error': 'No message provided'}), 400

    # Generate a chat_id if not provided
    if not chat_id:
        chat_id = str(uuid.uuid4())

    # Initialize or get chat history
    if chat_id not in chat_histories:
        chat_histories[chat_id] = []

    # Build context from chat history
    context_text = ""
    for q, a in chat_histories[chat_id]:
        context_text += f"User: {q}\nSparky: {a}\n"

    # Add YouTube context if available
    if context:
        transcript_text = extract_transcript_details(context)
        if not transcript_text.startswith("Error"):
            context_text += f"\nVideo Context:\n{transcript_text}\n"

    # Generate response
    input_with_context = f"{context_text}User: {message}\nSparky:"
    response = generate_gemini_content(input_with_context, guidance_prompt)

    # Update chat history
    chat_histories[chat_id].append((message, response))

    return jsonify({
        'response': response,
        'chat_id': chat_id
    })

if __name__ == '__main__':
    app.run(debug=True)
