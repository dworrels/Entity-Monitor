// converts HTML entities (like &quot;, &apos;, &amp;) into their corresponding characters (", ', &).
export const decodeHtml = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};

// Remove HTML Tags such as <p> or <div>
export function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}