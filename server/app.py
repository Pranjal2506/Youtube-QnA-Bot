from flask import Flask, request, jsonify
from main import extract_video_id, get_transcript, split_text, store_chunks, get_relevant_chunks, ask_bot
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

cache = {}


@app.route('/preprocess', methods=['POST'])
def preprocess():
    data = request.get_json()
    url = data.get('url')
    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        video_id = extract_video_id(url)
        if not video_id:
            return jsonify({"error": "Invalid YouTube URL"}), 400

        # Skip if already cached
        if video_id in cache:
            return jsonify({"message": "Already processed."}), 200

        # Process and cache
        video_id, transcript = get_transcript(url)
        print("Caching new vectorstore")
        if not transcript:
                return jsonify({"error": "Give link of video with English language."}), 404
        print("Splitting text")
        chunks = split_text(transcript)
        print("Storing chunks")
        vectorstore = store_chunks(chunks)
        print("Storing in cache")
        cache[video_id] = vectorstore
        print("Processing complete")
        return jsonify({"message": "Processing complete."}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    url = data.get('url')
    question = data.get('question')

    if not url or not question:
        return jsonify({"error": "URL and question are required"}), 400

    try:
        video_id = extract_video_id(url)

        # If vectorstore is cached
        if video_id in cache:
            print("Using cached vectorstore")
            vectorstore = cache[video_id]
        else:
            # Generate new vectorstore and cache it
            video_id, transcript = get_transcript(url)
            if not transcript:
                return jsonify({"error": "Give link of video with English language."}), 404
            chunks = split_text(transcript)
            vectorstore = store_chunks(chunks)
            cache[video_id] = vectorstore
            print("Cached new vectorstore")

        relevant_chunks = get_relevant_chunks(vectorstore, question)
        answer = ask_bot(question, relevant_chunks)
        return jsonify({"answer": answer})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
