# interpreter path: /Users/developer/Desktop/Project/server/venv/bin/python

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import re
import json
import feedparser
import requests
import time
import ollama
import newspaper
import tldextract
import concurrent.futures
from dateutil import parser as dateparser
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from groq import Groq, RateLimitError

# from langchain_google_genai import ChatGoogleGenerativeAI
from apscheduler.schedulers.background import BackgroundScheduler
import threading
from dotenv import load_dotenv
from io import BytesIO


REPORTS_DIR = os.path.join("projects", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

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
        # try:
        article = newspaper.article(entry["link"])
        article.download()
        article.parse()
        if article.top_image:
            image_url = article.top_image
        #
        # print(f"Error extracting image with newspaper4k for {entry.link}: {e}")

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
        # write feeds being fetched
        # print(f"Fetching: {source.get('title', source.get('rssUrl', 'Unknown Feed'))}")
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


def save_project_report(project_id, report_data):
    report_file = os.path.join(REPORTS_DIR, f"{project_id}.json")
    if os.path.exists(report_file):
        with open(report_file, "r") as f:
            reports = json.load(f)
    else:
        reports = []
    reports.append(report_data)
    with open(report_file, "w") as f:
        json.dump(reports, f, indent=2)


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

    # Load previous articles to find new ones
    previous_articles = []
    if os.path.exists(ARTICLES_FILE):
        with open(ARTICLES_FILE, "r") as f:
            previous_articles = json.load(f)
    previous_links = {a["link"] for a in previous_articles}

    # Find new articles
    new_articles = [a for a in unique_articles if a["link"] not in previous_links]

    with open(ARTICLES_FILE, "w") as f:
        json.dump(unique_articles, f, indent=2)
    print(f"Finished fetching articles in {time.time() - start:.2f} seconds")

    if os.path.exists(PROJECTS_FILE):
        with open(PROJECTS_FILE, "r") as f:
            projects = json.load(f)
    else:
        projects = []

    for article in new_articles:
        for project in projects:
            if (
                project["keyword"].lower()
                in (article["title"] + " " + article.get("description", "")).lower()
            ):
                today = datetime.now(ZoneInfo("America/New_York")).date()
                summary = summarize_article(
                    article["title"],
                    get_full_text_or_description(article),
                    article["published"],
                )
                report_data = {
                    "date": str(today),
                    "project": project["name"],
                    "article": article,
                    "summary": summary,
                }
                save_project_report(project["id"], report_data)


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


#### Start of Social Media API Endpoints


# Instagram image proxy
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


# Instagram API
@app.route("/api/instagram/posts", methods=["GET"])
def get_instagram_posts():
    username = request.args.get("username")
    count = request.args.get("count", "12")
    if not username:
        return jsonify({"error": "Missing username"}), 400

    try:
        url = "https://instagram-scraper21.p.rapidapi.com/api/v1/posts"
        querystring = {"username": username, "count": count}
        headers = {
            "x-rapidapi-key": os.environ.get("INSTAGRAM_API_KEY"),
            "x-rapidapi-host": "instagram-scraper21.p.rapidapi.com",
        }
        response = requests.get(url, headers=headers, params=querystring)
        data = response.json()

        # Optionally save to file for debugging
        # socialtest_path = os.path.join("debug", "socialtest.json")
        # os.makedirs(os.path.dirname(socialtest_path), exist_ok=True)
        # with open(socialtest_path, "w") as f:
        #     json.dump(data, f, indent=2)

        # Transform posts for frontend
        posts = []
        for post in data.get("data", {}).get("posts", []):
            caption = post.get("caption", "")
            taken_at = post.get("taken_at_human_readable") or post.get(
                "created_at_human_readable", ""
            )
            # Get first image url if available
            image_url = ""
            if isinstance(post.get("image"), list) and post["image"]:
                image_url = post["image"][0].get("url", "")
            # Fallback to video thumbnail if needed
            elif isinstance(post.get("video"), list) and post["video"]:
                image_url = post["video"][0].get("url", "")
            link = post.get("link", "")
            posts.append(
                {
                    "text": caption,
                    "taken_at": taken_at,
                    "image": image_url,
                    "username": username,
                    "link": link,
                }
            )

        return jsonify({"posts": posts})
    except Exception as e:
        print("error in /api/instagram/posts:", e)
        return jsonify({"error": str(e)}), 500


# X API
@app.route("/api/x/posts", methods=["GET"])
def get_x_posts():
    query = request.args.get("query")
    if not query:
        return jsonify({"error": "Missing query"}), 400
    try:
        url = "https://twitter-api45.p.rapidapi.com/search.php"
        querystring = {"query": query, "search_type": "Top"}
        headers = {
            "x-rapidapi-key": os.environ.get("X_API_KEY"),
            "x-rapidapi-host": "twitter-api45.p.rapidapi.com",
        }
        response = requests.get(url, headers=headers, params=querystring, timeout=10)
        data = response.json()

        # Optionally save to file for debugging
        socialtest_path = os.path.join("feeds", "socialtest.json")
        os.makedirs(os.path.dirname(socialtest_path), exist_ok=True)
        with open(socialtest_path, "w") as f:
            json.dump(data, f, indent=2)

        # Transform posts for frontend
        posts = []
        for item in data.get("timeline", []):
            if item.get("type") == "tweet":
                tweet_id = item.get("tweet_id", "")
                screen_name = item.get("screen_name", "")
                tweet_url = (
                    f"https://twitter.com/{screen_name}/status/{tweet_id}"
                    if screen_name and tweet_id
                    else ""
                )
                posts.append(
                    {
                        "username": screen_name,
                        "created_at": item.get("created_at", ""),
                        "text": item.get("text", ""),
                        "image": (
                            item.get("media", {})
                            .get("photo", [{}])[0]
                            .get("media_url_https", "")
                            if "media" in item
                            and "photo" in item["media"]
                            and item["media"]["photo"]
                            else ""
                        ),
                        "tweet_id": tweet_id,
                        "url": tweet_url,  # Add this line
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
        "x-rapidapi-key": os.environ.get("REDDIT_API_KEY"),
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


# Facebook API
@app.route("/api/facebook/posts", methods=["GET"])
def get_facebook_posts():
    query = request.args.get("query")
    from datetime import datetime, timedelta

    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=120)).strftime("%Y-%m-%d")
    if not query:
        return jsonify({"error": "Missing query"}), 400

    url = "https://facebook-realtimeapi.p.rapidapi.com/facebook/posts"
    querystring = {"query": query, "start_date": start_date, "end_date": end_date}
    headers = {
        "x-rapidapi-key": os.environ.get("FACEBOOK_API_KEY"),
        "x-rapidapi-host": "facebook-realtimeapi.p.rapidapi.com",
    }
    try:
        response = requests.get(url, headers=headers, params=querystring, timeout=10)
        data = response.json()

        # Adjust extraction based on actual API response structure
        edges = (
            data.get("data", {})
            .get("search_query", {})
            .get("combined_results", {})
            .get("edges", [])
        )
        posts = []
        for edge in edges:
            nt_bundle_attrs = (
                edge.get("native_template_view", {})
                .get("native_template_bundles", [{}])[0]
                .get("nt_bundle_attributes", [])
            )
            for attr in nt_bundle_attrs:
                story = attr.get("story_value", {})
                # Username
                username = ""
                if story.get("actors"):
                    username = story["actors"][0].get("name", "")
                # Caption
                caption = story.get("message", {}).get("text", "")
                # Image
                image = ""
                attachments = story.get("attachments", [])
                if attachments and "media" in attachments[0]:
                    image = attachments[0]["media"].get("image", {}).get("uri", "")
                elif attachments and "image" in attachments[0]:
                    image = attachments[0]["image"].get("uri", "")
                # Post URL
                url = story.get("url", "")
                # create post object
                creation_time = story.get("creation_time", "")
                created_at = (
                    datetime.fromtimestamp(creation_time, ZoneInfo("America/New_York"))
                    if creation_time
                    else ""
                )
                posts.append(
                    {
                        "username": username,
                        "caption": caption,
                        "image": image,
                        "url": url,
                        "created_at": created_at,
                    }
                )

        return jsonify({"posts": posts})
    except Exception as e:
        print("error in /api/facebook/posts:", e)
        return jsonify({"error": str(e)}), 500


# LinkedIn API
@app.route("/api/linkedin/posts", methods=["GET"])
def get_linkedin_posts():
    query = request.args.get("query")
    if not query:
        return jsonify({"error": "Missing query"}), 400

    url = "https://linkedin-api-data.p.rapidapi.com/post/search"
    querystring = {"limit": "20", "offsite": "1", "query": query}
    headers = {
        "x-rapidapi-key": os.environ.get("LINKEDIN_API_KEY"),
        "x-rapidapi-host": "linkedin-api-data.p.rapidapi.com",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    try:
        response = requests.get(url, headers=headers, params=querystring, timeout=10)
        data = response.json()

        # Defensive check for LinkedIn API errors or unexpected structure
        if (
            not data.get("success")
            or "data" not in data
            or "elements" not in data["data"]
        ):
            print(
                "LinkedIn API returned unexpected structure or error:",
                json.dumps(data, indent=2),
            )
            return jsonify({"error": "LinkedIn API error or no results"}), 502

        posts = []
        for element in data["data"]["elements"]:
            for item_obj in element.get("items", []):
                item = item_obj.get("item", {})
                update = item.get("searchFeedUpdate", {}).get("update", {})
                actor = update.get("actor", {})

                # Username/company name
                username = ""
                name_obj = actor.get("name", {})
                username = name_obj.get("text", "")
                # Fallback: company name from attributesV2
                if (
                    not username
                    and "attributesV2" in name_obj
                    and name_obj["attributesV2"]
                ):
                    detail = name_obj["attributesV2"][0].get("detailData", {})
                    company = detail.get("companyName", {})
                    username = company.get("name", "")

                # Caption
                caption = update.get("commentary", {}).get("text", {}).get("text", "")

                # Image (articleComponent or imageComponent)
                image_url = ""
                content = update.get("content", {})
                if not isinstance(content, dict):
                    content = {}

                # Try articleComponent
                article = content.get("articleComponent", {}) if content else {}
                large_image = article.get("largeImage", {}) if article else {}
                attributes = large_image.get("attributes", []) if large_image else []
                if attributes and isinstance(attributes, list) and len(attributes) > 0:
                    detail_data = (
                        attributes[0].get("detailData", {}) if attributes[0] else {}
                    )
                    vector_image = (
                        detail_data.get("vectorImage", {}) if detail_data else {}
                    )
                    root_url = vector_image.get("rootUrl", "") if vector_image else ""
                    artifacts = (
                        vector_image.get("artifacts", []) if vector_image else []
                    )
                    if root_url and isinstance(artifacts, list) and len(artifacts) > 0:
                        image_url = root_url + artifacts[0].get(
                            "fileIdentifyingUrlPathSegment", ""
                        )

                # Try imageComponent if articleComponent not present
                if (
                    not image_url
                    and isinstance(content, dict)
                    and "imageComponent" in content
                    and content["imageComponent"]
                ):
                    images = (
                        content["imageComponent"].get("images", [])
                        if content["imageComponent"]
                        else []
                    )
                    if images and isinstance(images, list) and len(images) > 0:
                        attrs = images[0].get("attributes", []) if images[0] else []
                        if attrs and isinstance(attrs, list) and len(attrs) > 0:
                            detail_data = (
                                attrs[0].get("detailData", {}) if attrs[0] else {}
                            )
                            vector_image = (
                                detail_data.get("vectorImage", {})
                                if detail_data
                                else {}
                            )
                            root_url = (
                                vector_image.get("rootUrl", "") if vector_image else ""
                            )
                            artifacts = (
                                vector_image.get("artifacts", [])
                                if vector_image
                                else []
                            )
                            if (
                                root_url
                                and isinstance(artifacts, list)
                                and len(artifacts) > 0
                            ):
                                image_url = root_url + artifacts[0].get(
                                    "fileIdentifyingUrlPathSegment", ""
                                )

                post_url = update.get("socialContent", {}).get("shareUrl", "")

                posts.append(
                    {
                        "username": username,
                        "caption": caption,
                        "image": image_url,
                        "url": post_url,
                    }
                )

        return jsonify({"posts": posts})
    except Exception as e:
        print("error in /api/linkedin/posts:", e)
        return jsonify({"error": str(e)}), 500


# Youtube API
@app.route("/api/youtube/videos", methods=["GET"])
def get_youtube_videos():
    query = request.args.get("query")
    if not query:
        return jsonify({"error": "Missing query"}), 400

    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": 36,
        "key": os.environ.get("YOUTUBE_API_KEY"),
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        posts = []
        for item in data.get("items", []):
            title = item["snippet"]["title"]
            video_id = item["id"]["videoId"]
            channel_title = item["snippet"]["channelTitle"]
            published_date = item["snippet"]["publishedAt"]
            thumbnail_url = item["snippet"]["thumbnails"]["high"]["url"]
            posts.append(
                {
                    "title": title,
                    "channel": channel_title,
                    "date": published_date,
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "thumbnail": thumbnail_url,
                }
            )
        return jsonify({"posts": posts})
    except Exception as e:
        print("error in /api/youtube/videos:", e)
        return jsonify({"error": str(e)}), 500


#


# Telegram API
@app.route("/api/telegram/search", methods=["GET"])
def search_telegram():
    query = request.args.get("query")
    limit = request.args.get("limit", "10")
    if not query:
        return jsonify({"error": "Missing query"}), 400

    url = "https://telegram-scraper-api.p.rapidapi.com/entity/search"
    querystring = {"q": query, "limit": limit}
    headers = {
        "x-rapidapi-key": os.environ.get("TELEGRAM_API_KEY"),
        "x-rapidapi-host": "telegram-scraper-api.p.rapidapi.com",
    }
    try:
        response = requests.get(url, headers=headers, params=querystring, timeout=10)
        data = response.json()
        results = []

        # Add chats
        for chat in data.get("data", {}).get("chats", []):
            results.append(
                {
                    "title": chat.get("title"),
                    "username": chat.get("username"),
                    "participantsCount": chat.get("participantsCount"),
                }
            )

        # Add users (if you want to show users too)
        for user in data.get("data", {}).get("users", []):
            results.append(
                {
                    "title": user.get("firstName", ""),
                    "username": user.get("username"),
                    "participantsCount": None,
                }
            )

        return jsonify({"results": results})
    except Exception as e:
        print("error in /api/telegram/search:", e)
        return jsonify({"error": str(e)}), 500


# WhatsApp API

# Discord API

#### OLLAMA Summarization


def split_text_into_chunks(text, chunk_size=400, overlap=50):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = words[i : i + chunk_size]
        chunks.append(" ".join(chunk))
        if i + chunk_size >= len(words):
            break
        i += chunk_size - overlap
    return chunks


def summarize_with_mistral(prompt, model="mistral"):
    client = ollama.Client()
    response = client.generate(model=model, prompt=prompt)
    return response.response.strip()


def summarize_with_groq(prompt, model="llama3-8b-8192"):
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    while True:
        try:
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model,
            )
            return chat_completion.choices[0].message.content.strip()
        except RateLimitError as e:
            # Parse wait time from error message if possible, else default to 15s
            print("Groq rate limit hit, waiting 15s...")
            time.sleep(15)


# LLM Model selection logic
def summarize_with_model(prompt, model="mistral"):
    if model.startswith("groq"):
        # example model name: "groq/llama3-8b-8192"
        groq_model = model.replace("groq-", "")
        return summarize_with_groq(prompt, model=groq_model)
    else:
        return summarize_with_mistral(prompt, model=model)


def summarize_article(title, text, published, model="groq"):
    # Chunk and summarize each article
    if len(text.split()) < 1000:
        prompt = f"Title: {title}\nDate: {published}\n\n{text}\n\nSummarize this article in detail."
        return summarize_with_model(prompt, model=model)
    chunk_size = 1000
    overlap = 0
    chunks = split_text_into_chunks(text, chunk_size, overlap)
    chunk_summaries = []
    for idx, chunk in enumerate(chunks):
        prompt = (
            f"Title: {title}\nDate: {published}\n\n"
            f"Article chunk {idx+1} of {len(chunks)}:\n{chunk}\n\n"
            "Summarize this chunk in detail."
        )
        summary = summarize_with_model(prompt, model=model)
        chunk_summaries.append(summary)

    # merge summaries
    merge_prompt = (
        f"Title: {title}\nDate: {published}\n\n"
        "Here are the summaries of each chunk of a long article:\n\n"
        + "\n\n".join(
            f"Chunk {i+1} summary:\n{cs}" for i, cs in enumerate(chunk_summaries)
        )
        + "\n\nCombine these into a single, coherent, non-repetitive summary of the full article."
    )
    return summarize_with_model(merge_prompt, model=model)


def get_full_text_or_description(article):
    try:
        art = newspaper.article(article["link"])
        art.download()
        art.parse()
        if art.text and len(art.text) > 100:
            return art.text
    except Exception as e:
        print(f"newspaper4k error for {article['link']}: {e}")
    return article.get("description", "")


@app.route("/api/projects/<project_id>/daily_report", methods=["POST"])
def generate_daily_report(project_id):
    print("generate_daily_report called")
    # Get project
    if os.path.exists(PROJECTS_FILE):
        with open(PROJECTS_FILE, "r") as f:
            projects = json.load(f)
    else:
        return jsonify({"error": "No projects found"}), 404
    project = next((p for p in projects if p["id"] == project_id), None)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    today = datetime.now(ZoneInfo("America/New_York")).date()
    report_file = os.path.join(REPORTS_DIR, f"{project_id}.json")

    cached_report = None
    if os.path.exists(report_file):
        with open(report_file, "r") as f:
            reports = json.load(f)
        for rep in reports:
            if rep.get("date") == str(today):
                cached_report = rep
                break

    if cached_report:
        print("Returning cached report for today")
        return jsonify(cached_report)

    if os.path.exists(ARTICLES_FILE):
        with open(ARTICLES_FILE, "r") as f:
            articles = json.load(f)
    else:
        articles = []

    # Get filtered article links from frontend
    data = request.get_json()
    article_links = set(data.get("article_links", []))
    model = data.get("model", "groq-llama3-8b-8192")

    # Only use articles that are in the provided list and published today
    def is_today(article):
        try:
            dt = dateparser.parse(article.get("published", ""))
            return dt and dt.date() == today
        except Exception:
            return False

    todays_articles = [
        a for a in articles if a["link"] in article_links and is_today(a)
    ]

    print(f"Number of articles used for daily report: {len(todays_articles)}")

    if not todays_articles:
        return jsonify({"message": "No articles found for today's date."})

    def summarize_one_article(article):
        start = time.time()
        full_text = get_full_text_or_description(article)
        summary = summarize_article(
            article["title"], full_text, article["published"], model=model
        )
        print(f"Summarized article '{article['title']}' in {time.time() - start:.2f}s")
        return f"Source: {article.get('source', 'Unknown')}\nTitle: {article['title']}\nDate: {article['published']}\nSummary:\n{summary}\n"

    # In your endpoint  :
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        summaries = list(executor.map(summarize_one_article, todays_articles))

    MAX_ARTICLES_PER_BATCH = 3  # or whatever fits in Groq's token limit
    all_reports = []

    # for i in range(0, len(summaries), MAX_ARTICLES_PER_BATCH):
    # batch = summaries[i : i + MAX_ARTICLES_PER_BATCH]
    merge_prompt = (
        f"Project: {project['name']}\nDate: {today}\n\n"
        "Below are summaries of today's articles:\n\n"
        + "\n\n".join(
            f"Article {i+1}:\n{summary}" for i, summary in enumerate(summaries)
        )
        + "\n\nUsing only the information provided above, write a single, professional daily briefing in paragraph form. "
        "Begin directly with the summary. Do not use a title or heading at the start. "
        "The briefing should include:\n"
        "1. An introductory paragraph that summarizes the main themes of the day.\n"
        "2. One to three concise paragraphs that elaborate on key developments and stories, without repeating information.\n"
        "3. A final paragraph with the heading INSIGHT (in all caps), offering a synthesis of trends or implications strictly based on the article summaries.\n"
        "Do not use bullet points, lists, or add any external knowledge. Keep the tone concise and informative."
    )

    report = summarize_with_model(merge_prompt, model=model)

    report_data = {
        "date": str(today),
        "project": project["name"],
        "article_count": len(todays_articles),
        "report": report,
        "summaries": summaries,
    }

    if os.path.exists(report_file):
        with open(report_file, "r") as f:
            reports = json.load(f)
    else:
        reports = []
    reports.append(report_data)
    with open(report_file, "w") as f:
        json.dump(reports, f, indent=2)

    print(f"Daily report generated and saved for {today}")

    return jsonify(report_data)


@app.route("/api/keyword_alert", methods=["POST"])
def keyword_alert():
    data = request.json
    print("📥 Keyword Alert Received:", data)
    # You could save this to a file or project feed here
    return jsonify({"status": "ok"}), 200


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
