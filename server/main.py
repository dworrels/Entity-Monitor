# interpreter path: /Users/developer/Desktop/Project/server/venv/bin/python

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_caching import Cache
import os
import json
import feedparser


app = Flask(__name__)
# CORS(app, origins=["http://localhost:5173"])  # The frontend URL
CORS(app, origins=["http://192.168.5.49:5173"])

SOURCE_FILE = os.path.join("feeds", "sources.json")


# Ensure the feeds directory exists
@app.route("/api/sources", methods=["POST", "PUT"])
def add_source():
    new_source = request.get_json()

    if not new_source or "title" not in new_source or "rssUrl" not in new_source:
        return jsonify({"error": "Invalid data"}), 400

    # Assign an ID based on the title if not provided
    new_source.setdefault("id", new_source["title"].lower().replace(" ", ""))

    # Load existing sources
    if os.path.exists(SOURCE_FILE):
        with open(SOURCE_FILE, "r") as f:
            sources = json.load(f)
    else:
        sources = []

    sources.append(new_source)

    # Save updated list
    with open(SOURCE_FILE, "w") as f:
        json.dump(sources, f, indent=2)

    return jsonify(sources), 201  # 201 = Created


# Get all sources
@app.route("/api/sources", methods=["GET"])
def get_sources():
    if os.path.exists(SOURCE_FILE):
        with open(SOURCE_FILE, "r") as f:
            sources = json.load(f)
    else:
        sources = []

    return jsonify(sources), 200  # 200 = OK


# Delete Source
@app.route("/api/sources/<source_id>", methods=["DELETE"])
def delete_source(source_id):
    if os.path.exists(SOURCE_FILE):
        with open(SOURCE_FILE, "r") as f:
            sources = json.load(f)
    else:
        sources = []

    updated_sources = [s for s in sources if s.get("id") != source_id]

    with open(SOURCE_FILE, "w") as f:
        json.dump(updated_sources, f, indent=2)

    return jsonify(updated_sources), 200  # 200 = OK


# Edit Source
@app.route("/api/sources/<string:source_id>", methods=["PUT"])
def update_source(source_id):
    updated_data = request.get_json()

    if os.path.exists(SOURCE_FILE):
        with open(SOURCE_FILE, "r") as f:
            sources = json.load(f)

    else:
        sources = []

    for source in sources:
        if source["id"] == source_id:
            source["title"] = updated_data.get("title", source["title"])
            source["rssUrl"] = updated_data.get("rssUrl", source["rssUrl"])
            break
    else:
        return jsonify({"error": "Source not found"}), 404

    with open(SOURCE_FILE, "w") as f:
        json.dump(sources, f, indent=2)

    return jsonify(sources), 200

# in-memory cache
cache = Cache(app, config={"CACHE_TYPE": "SimpleCache", "CACHE_DEFAULT_TIMEOUT": 300}) # 5 minutes

# Parse articles for Home page
@app.route("/api/articles", methods=["GET"])
@cache.cached(timeout=300) # cache for 5 minutes will take 5 minutes for new sources to load
def get_articles():
    if os.path.exists(SOURCE_FILE):
        with open(SOURCE_FILE, "r") as f:
            sources = json.load(f)

    else:
        sources = []

    all_articles = []
    for source in sources:
        feed = feedparser.parse(source["rssUrl"])
        for entry in feed.entries[:5]: #limit to latest 5 per source
            all_articles.append({
                "title": entry.title,
                "link": entry.link,
                "description": getattr(entry, "description", ""),
                "source": source["title"],
                "published": entry.published if "published" in entry else "",
                "image": entry.get("media_content", [{}])[0].get("url", "")  # handle images
            })
    return jsonify(all_articles)


# Test if backend is running http://127.0.0.1:8090/
#   @app.route("/")
#   def index():
#    return "Flask backend is running."

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=8090)
