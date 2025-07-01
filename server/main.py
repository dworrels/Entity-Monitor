# interpreter path: /Users/developer/Desktop/Project/server/venv/bin/python

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_caching import Cache
import os
import json
import feedparser
from dateutil import parser as dateparser
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
import threading
from dotenv import load_dotenv

load_dotenv()
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")

app = Flask(__name__)
# CORS(app, origins=["http://localhost:5173"])  # The frontend URL
CORS(app, origins=[frontend_url])

SOURCE_FILE = os.path.join("feeds", "sources.json")
ARTICLES_FILE = os.path.join("articles", "articles.json")
PROJECTS_FILE = os.path.join("projects", "projects.json")


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
cache = Cache(
    app, config={"CACHE_TYPE": "SimpleCache", "CACHE_DEFAULT_TIMEOUT": 300}
)  # 5 minutes


# Background refresh
def fetch_and_save_articles():
    if os.path.exists(SOURCE_FILE):
        with open(SOURCE_FILE, "r") as f:
            sources = json.load(f)
    else:
        sources = []

    all_articles = []
    for source in sources:
        feed = feedparser.parse(source["rssUrl"])
        for entry in feed.entries:
            all_articles.append(
                {
                    "title": entry.title,
                    "link": entry.link,
                    "description": getattr(entry, "description", ""),
                    "source": source.get("title", ""),
                    "published": entry.published if "published" in entry else "",
                    "image": entry.get("media_content", [{}])[0].get("url", ""),
                }
            )

    def parse_date_safe(date_str):
        try:
            dt = dateparser.parse(date_str)
            if dt is not None:
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                else:
                    dt = dt.astimezone(timezone.utc)
                return dt
        except Exception:
            pass
        return datetime(1970, 1, 1, tzinfo=timezone.utc)

    all_articles.sort(key=lambda x: parse_date_safe(x["published"]), reverse=True)

    with open(ARTICLES_FILE, "w") as f:
        json.dump(all_articles, f, indent=2)


# Parse articles for Home page
@app.route("/api/articles", methods=["GET"])
def get_articles():
    if os.path.exists(ARTICLES_FILE):
        with open(ARTICLES_FILE, "r") as f:
            articles = json.load(f)

    else:
        articles = []
    return jsonify(articles)

    # Sort latest feeds by date published


def parse_date_safe(date_str):
    try:
        dt = dateparser.parse(date_str)
        if dt is not None:
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
            return dt
    except Exception:
        pass
    return datetime(1970, 1, 1, tzinfo=timezone.utc)

    # Create Project


@app.route("/api/projects", methods=["GET"])
def get_projects():
    if os.path.exists(PROJECTS_FILE):
        with open(PROJECTS_FILE, "r") as f:
            projects = json.load(f)

    else:
        projects = []
    return jsonify(projects), 200


@app.route("/api/projects", methods=["POST"])
def add_project():
    new_project = request.get_json()
    if not new_project or "name" not in new_project or "keyword" not in new_project:
        return jsonify({"error": "Invalid data"}), 400

    new_project.setdefault("id", str(int(datetime.now().timestamp() * 1000)))
    new_project.setdefault("date", datetime.now().strftime("%Y-%m-%d"))

    if os.path.exists(PROJECTS_FILE):
        with open(PROJECTS_FILE, "r") as f:
            projects = json.load(f)

    else:
        projects = []

    projects.append(new_project)
    with open(PROJECTS_FILE, "w") as f:
        json.dump(projects, f, indent=2)

    return jsonify(new_project), 201


# Test if backend is running http://127.0.0.1:8090/
#   @app.route("/")
#   def index():
#    return "Flask backend is running."

scheduler = BackgroundScheduler()
scheduler.add_job(fetch_and_save_articles, "interval", minutes=10)
scheduler.start()

threading.Thread(target=fetch_and_save_articles).start()

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=8090)
