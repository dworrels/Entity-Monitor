export function matchesBooleanSearch(text, query) {
    text = text.toLowerCase();

    // Tokenize phrases, AND, NOT, OR, parentheses.
    const tokens = [];
    const re = /"([^"]+)"|(\()|(\))|(\bAND\b|\bOR\b|\bNOT\b)|(\S+)/gi;
    let match;
    while((match = re.exec(query))) {
        if (match[1]) tokens.push({ type: "PHRASE", value: match[1].toLowerCase() });
        else if (match[2]) tokens.push({ type: "LPAREN" });
        else if (match[3]) tokens.push({ type: "RPAREN" });
        else if (match[4]) tokens.push({ type: match[4].toUpperCase() });
        else if (match[5]) tokens.push({ type: "WORD", value: match[5].toLowerCase() });
    }
    
    // Recursive parser 
    function parseExpr(index = 0) {
        let nodes = [];
        let op = null;
        function applyOp(left, right, op) {
            if (op == "AND") return { type: "AND", left, right };
            if (op == "OR") return { type: "OR", left, right };
            return right;
        }
        while (index < tokens.length) {
            const token = tokens[index];
            if (token.type === "LPAREN") {
                const [node, nextIdx] = parseExpr(index + 1);
                nodes.push(node);
                index = nextIdx;
            } else if (token.type === "RPAREN") {
                index++;
                break;
            } else if (token.type === "AND" || token.type === "OR") {
                op = token.type;
                index++;
            } else if (token.type === "NOT") {

                const [node, nextIdx] = parseExpr(index + 1);
                nodes.push({ type: "NOT", node });
                index = nextIdx;
            } else if (token.type === "PHRASE" || token.type === "WORD") {
                nodes.push(token);
                index++;
            } else {
                index++;
            }

            while (nodes.length >= 2 && op) {
                const right = nodes.pop();
                const left = nodes.pop();
                nodes.push(applyOp(left, right, op));
                op = null;
            }
        }
        return [nodes[0], index];
    }

    function evalNode(node) {
        if (!node) return true;
        if (node.type === "PHRASE") return text.includes(node.value);
        if (node.type === "WORD") return text.includes(node.value);
        if (node.type === "AND") return evalNode(node.left) && evalNode(node.right);
        if (node.type === "OR") return evalNode(node.left) || evalNode(node.right);
        if (node.type === "NOT") return !evalNode(node.node);
        return true;
    }

    const [ast] = parseExpr();
    return evalNode(ast);
}