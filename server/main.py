# interpreter path: /Users/developer/Desktop/Project/server/venv/bin/python

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import re
import json
import feedparser
import requests
import time
import newspaper
import tldextract
import concurrent.futures
from dateutil import parser as dateparser
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
import threading
from dotenv import load_dotenv
from io import BytesIO
from lxml import etree

brandfetch_api_key = os.environ.get("BRANDFETCH_API_KEY")

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

    # Clean Up title and rssUrl
    title = new_source["title"] = new_source["title"].strip() if new_source else ""
    rss_url = new_source["rssUrl"] = new_source["rssUrl"].strip() if new_source else ""

    # Check for required fields
    if not title or not rss_url:
        return jsonify({"error": "Feed title and RSS feed URL are required."}), 400

    # Validate rssUrl
    if not (rss_url.startswith("https://") or rss_url.startswith("http://")):
        return (
            jsonify(
                {
                    "error": "RSS feed URL is invalid. It must start with 'https://' or 'http://'"
                }
            ),
            400,
        )

    # Load existing sources
    if os.path.exists(SOURCE_FILE):
        with open(SOURCE_FILE, "r") as f:
            sources = json.load(f)
    else:
        sources = []

    # Check for duplicate rssUrl (case insensitive, trimmed)
    for s in sources:
        if s.get("rssUrl", "").strip().lower() == rss_url.lower():
            return jsonify({"error": "This RSS feed URL already exists."}), 400

    # assign a unique numeric ID
    existing_ids = {int(s["id"]) for s in sources if str(s.get("id", "")).isdigit()}
    next_id = str(max(existing_ids) + 1) if existing_ids else "1"
    new_source["id"] = next_id

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


def get_brandfetch_logo(domain, api_key):
    try:
        url = f"https://api.brandfetch.io/v2/search/{domain}"
        headers = {"Authorization": f"Bearer {api_key}"}
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            # Brandfetch /v2/search returns a list of brands with an "icon" field
            if data and isinstance(data, list):
                logos = data[0].get("logos", [])
                for logo in logos:
                    for fmt in logo.get("formats", []):
                        if fmt.get("format") == "svg" and fmt.get("src"):
                            return fmt["src"]
                if "icon" in data[0]:
                    return data[0]["icon"]
        return ""
    except Exception as e:
        print(f"Brandfetch error for {domain}: {e}")
        return ""

brandfetch_cache = {}

# Get image from feed entry or Brandfetch
def find_article_image(entry, source, brandfetch_api_key):
    image_url = ""

    # Try media content
    if "media_content" in entry and entry.media_content:
        image_url = entry.media_content[0].get("url", "")

    # Try media_thumbnail
    if not image_url and "media_thumbnail" in entry and entry.media_thumbnail:
        image_url = entry.media_thumbnail[0].get("url", "")

    # Try <image> tag (attribute or key)
    if not image_url:
        if hasattr(entry, "image"):
            if isinstance(entry.image, dict):
                image_url = entry.image.get("href", "") or entry.image.get("url", "")
            elif isinstance(entry.image, str):
                image_url = entry.image
        elif "image" in entry:
            image_url = entry["image"]

    # Try <image>...</image> in description
    if not image_url and "description" in entry:
        match = re.search(r"<image>(.*?)</image>", entry.description)
        if match:
            image_url = match.group(1)

    # Try <img src="..."> in description
    if not image_url and "description" in entry:
        match = re.search(r'<img[^>]+src="([^"]+)"', entry["description"])
        if match:
            image_url = match.group(1)

    # Try <img src="..."> in content:encoded
    if not image_url and "content" in entry:
        for content_item in entry.content:
            if "value" in content_item:
                match = re.search(r'<img[^>]+src="([^"]+)"', content_item["value"])
                if match:
                    image_url = match.group(1)
                    break
    
    # Use newspaper4k to extract image
    if not image_url and "link" in entry:
        try: 
            article = newspaper.article(entry["link"])
            article.download()
            article.parse()
            if article.top_image:
                image_url = article.top_image
        except Exception as e:
            print(f"Error extracting image with newspaper4k for {entry.link}: {e}")

    # enclosure tag
    if not image_url and "enclosures" in entry and entry.enclosures:
        image_url = entry.enclosures[0].get("url", "") or entry.enclosures[0].get(
            "href", ""
        )

    # Fallback: parse raw XML for <image> tag
    # if not image_url and "rssUrl" in source:
    #     print(f"Starting RAW XML parse for {source.get('title', source.get('rssUrl', ''))}")
    #     xml_start = time.time()
    #     rss_url = source["rssUrl"]
    #     response = requests.get(rss_url)
    #     parser = etree.XMLParser(recover=True)
    #     root = etree.fromstring(response.content, parser=parser)
    #     for item in root.findall(".//item"):
    #         # Match the entry's link to the item's link in the XML
    #         if item.findtext("link") == entry.link:
    #             image_url = item.findtext("image")
    #             if image_url:
    #                 break
    #     xml_elapsed = time.time() - xml_start
    #     print(f"RAW XML parse for {source.get('title', source.get('rssUrl', ''))} took {xml_elapsed:.2f} seconds")

    # Brandfetch fallback
    if not image_url:
        ext = tldextract.extract(entry.link)
        domain = f"{ext.domain}.{ext.suffix}"
        if domain in brandfetch_cache:
            image_url = brandfetch_cache[domain]
        else:
            image_url = get_brandfetch_logo(domain, brandfetch_api_key)
            brandfetch_cache[domain] = image_url
        if not image_url:
            image_url = "https://placehold.co/160x90?text=No+Image"

    return image_url


def fetch_feed(source):
    try:
        # write and count feeds being fetched
        print(f"Fetching: {source.get('title', source.get('rssUrl', 'Unknown Feed'))}")
        start = time.time()
        feed = feedparser.parse(source["rssUrl"])
        elapsed = time.time() - start
        if elapsed > 5:
            print(
                f"WARNING Slow Feed ({elapsed:.2f}s): {source['title']} - {source['rssUrl']}"
            )
        articles = []
        for entry in feed.entries:
            image_url = find_article_image(entry, source, brandfetch_api_key)
            articles.append(
                {
                    "title": entry.title,
                    "link": entry.link,
                    "description": getattr(entry, "description", ""),
                    "source": source.get("title", ""),
                    "published": entry.published if "published" in entry else "",
                    "image": image_url,
                }
            )
        return articles
    except Exception as e:
        print(f"Error parsing feed {source['rssUrl']}: {e}")
        return []

# Background refresh
def fetch_and_save_articles():
    start = time.time()
    print("FETCHING ARTICLES...")
    if os.path.exists(SOURCE_FILE):
        with open(SOURCE_FILE, "r") as f:
            sources = json.load(f)
    else:
        sources = []

    all_articles = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(fetch_feed, sources))
        for articles in results:
            all_articles.extend(articles)

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

    # print all articles with published date
    print(f"All dates parsed")

    # Remove duplicates based on link
    unique_articles = []
    seen_links = set()
    for article in all_articles:
        if article["link"] not in seen_links:
            unique_articles.append(article)
            seen_links.add(article["link"])

    unique_articles.sort(key=lambda x: parse_date_safe(x["published"]), reverse=True)
    print(f"all articles deduplicated")

    with open(ARTICLES_FILE, "w") as f:
        json.dump(unique_articles, f, indent=2)
    print(f"Finished fetching articles in {time.time() - start:.2f} seconds")


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

    projects.sort(key=lambda x: int(x.get("id", 0)), reverse=True)
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


# Instagram API
@app.route("/api/proxy-image")
def proxy_image():
    url = request.args.get("url")
    if not url:
        return "Missing url", 400
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        return send_file(
            BytesIO(resp.content),
            mimetype=resp.headers.get("content-type", "image/jpeg"),
        )
    except Exception as e:
        print("proxy error:", e)
        return "Error fetching image", 500


@app.route("/api/instagram/posts", methods=["GET"])
def get_instagram_posts():
    username = request.args.get("username")
    if not username:
        return jsonify({"error": "Missing username"}), 400

    try:
        url = "https://instagram120.p.rapidapi.com/api/instagram/posts"
        payload = {"username": username, "maxId": ""}
        headers = {
            "x-rapidapi-key": "2775a7ff29msh8148d70ff23fff3p131e90jsndb64d50686b8",
            "x-rapidapi-host": "instagram120.p.rapidapi.com",
            "Content-Type": "application/json",
        }
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        try:
            data = response.json()
        except Exception:
            print("Non-JSON response from Instagram API:", response.text)
            return (
                jsonify(
                    {"error": "Instagram API did not return JSON", "raw": response.text}
                ),
                500,
            )

        # --- FIX: handle result.edges structure ---
        edges = data.get("result", {}).get("edges", [])
        if not isinstance(edges, list):
            return jsonify({"error": "Unexpected API response", "raw": data}), 500

        posts = []
        for edge in edges:
            node = edge.get("node", {})
            caption = node.get("caption", {})
            text = caption.get("text", "")
            taken_at = node.get("taken_at", "")
            image_url = ""
            first_candidate_url = ""
            image_versions2 = node.get("image_versions2", {})
            candidates = (
                image_versions2.get("candidates", [])
                if isinstance(image_versions2, dict)
                else []
            )
            if candidates and isinstance(candidates, list):
                first_candidate_url = candidates[0].get("url", "")
                image_url = first_candidate_url

            taken_at_str = ""
            if isinstance(taken_at, int) or (
                isinstance(taken_at, str) and taken_at.isdigit()
            ):
                taken_at_str = (
                    datetime.utcfromtimestamp(int(taken_at)).isoformat() + "Z"
                )
            else:
                taken_at_str = taken_at

            posts.append(
                {
                    "text": text,
                    "image": image_url,
                    "taken_at": taken_at_str,
                    "first_url": first_candidate_url,
                }
            )
        return jsonify({"posts": posts})
    except Exception as e:
        print("error in /api/instagram/posts:", e)
        return jsonify({"error": str(e)}), 500


# X API
@app.route("/api/x/posts", methods=["GET"])
def get_x_posts():
    username = request.args.get("username")
    if not username:
        return jsonify({"error": "Missing username"}), 400

    try:
        url = "https://twitter-api45.p.rapidapi.com/usermedia.php"
        querystring = {"screenname": username}
        headers = {
            "x-rapidapi-key": "2775a7ff29msh8148d70ff23fff3p131e90jsndb64d50686b8",
            "x-rapidapi-host": "twitter-api45.p.rapidapi.com",
        }
        response = requests.get(url, headers=headers, params=querystring, timeout=10)
        try:
            data = response.json()
        except Exception:
            print("Non-JSON respnse from X API:", response.text)
            return (
                jsonify({"error": "X API did not return JSON", "raw": response.text}),
                500,
            )

        timeline = data.get("timeline", [])
        posts = []
        for item in timeline:
            text = item.get("text", "")
            taken_at = item.get("created_at", "")
            media_url = ""

            media = item.get("media", {})
            if "photo" in media and isinstance(media["photo"], list) and media["photo"]:
                media_url = media["photo"][0].get("media_url_https") or media["photo"][
                    0
                ].get("media_url", "")

            elif (
                "video" in media and isinstance(media["video"], list) and media["video"]
            ):
                media_url = media["video"][0].get("media_url_https") or media["video"][
                    0
                ].get("media_url", "")

            print(
                {
                    "text": text,
                    "image": media_url,
                    "taken_at": taken_at,
                    "first_url": media_url,
                }
            )

            posts.append(
                {
                    "text": text,
                    "image": media_url,
                    "taken_at": taken_at,
                    "first_url": media_url,
                    "username": username,
                    "link": f"https://x.com/{username}/status/{item.get('tweet_id', '')}",
                }
            )

        return jsonify({"posts": posts})
    except Exception as e:
        print("error in /api/x/posts:", e)
        return jsonify({"error": str(e)}), 500


# Reddit API
@app.route("/api/reddit", methods=["GET"])
def get_reddit():
    query = request.args.get("query", "")
    subreddit = request.args.get("subreddit", "")
    if not query:
        return jsonify({"error": "Missing query"}), 400

    url = "https://reddit3.p.rapidapi.com/v1/reddit/search"

    querystring = {
        "search": query,
        "filter": "posts",
        "timefilter": "all",
        "sortType": "relevance",
    }

    if subreddit:
        querystring["subreddit"] = subreddit

    headers = {
        "x-rapidapi-key": "2775a7ff29msh8148d70ff23fff3p131e90jsndb64d50686b8",
        "x-rapidapi-host": "reddit3.p.rapidapi.com",
    }

    try:
        resp = requests.get(url, headers=headers, params=querystring, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        posts = []

        for post in data.get("body", []):
            posts.append(
                {
                    "title": post.get("title"),
                    "subreddit": post.get("subreddit"),
                    "user": post.get("author"),
                    "selftext": post.get("selftext"),
                    "permalink": f"https://reddit.com{post.get('permalink', '')}",
                }
            )
        return jsonify({"posts": posts})
    except Exception as e:
        print("Reddit API error:", e)
        return jsonify({"error": str(e)}), 500


# Run Flask app and scheduler
if __name__ == "__main__":
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        threading.Thread(target=fetch_and_save_articles).start()
        scheduler = BackgroundScheduler()
        scheduler.add_job(fetch_and_save_articles, "interval", minutes=15)
        scheduler.start()
    app.run(host="0.0.0.0", debug=True, port=8090)

# Test if backend is running http://127.0.0.1:8090/
#   @app.route("/")
#   def index():
#    return "Flask backend is running."
