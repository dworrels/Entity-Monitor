import os
import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

ARTICLES_FILE = os.path.join("articles", "articles.json")
INDEX_FILE = os.path.join("articles", "faiss.index")
EMBEDDINGS_FILE = os.path.join("articles", "embeddings.json")

model = SentenceTransformer("all-MiniLM-L6-v2")

def load_articles():
    with open(ARTICLES_FILE, "r") as f:
        articles = json.load(f)
    # Filter out articles missing 'title' or 'link'
    valid_articles = [a for a in articles if "title" in a and "link" in a]
    return valid_articles

def build_index():
    articles = load_articles()
    if not articles:
        raise ValueError("No valid articles with 'title' and 'link' found.")
    texts = [a["title"] + " " + a.get("description", "") for a in articles]
    embeddings = model.encode(texts, show_progress_bar=True)
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(np.array(embeddings).astype("float32"))
    faiss.write_index(index, INDEX_FILE)

    with open(EMBEDDINGS_FILE, "w") as f:
        json.dump([a["link"] for a in articles], f)
    print("Built FAISS index and saved")

def semantic_search(query, top_k=10):
    print("Semantic search called with query:", query)
    
    if not os.path.exists(INDEX_FILE) or not os.path.exists(EMBEDDINGS_FILE):
        print("Index or embeddings file missing — rebuilding...")
        build_index()

    index = faiss.read_index(INDEX_FILE)
    with open(EMBEDDINGS_FILE, "r") as f:
        links = json.load(f)
    articles = load_articles()

    if index.ntotal != len(links):
        raise ValueError(f"Mismatch: index has {index.ntotal} vectors, but embeddings.json has {len(links)}")

    query_emb = model.encode([query])
    D, I = index.search(np.array(query_emb).astype("float32"), top_k)

    results = []
    for idx in I[0]:
        if idx >= len(links):
            print(f"Index {idx} out of range for links (len={len(links)})")
            continue
        link = links[idx]
        article = next((a for a in articles if a["link"] == link), None)
        if article:
            results.append(article)

    return results

