// Parsing JSON
const parseJSON = (req, res, next) => {
  // This is only good for bodies that their size is less than the highWaterMark value

  if (req.headers["content-type"] === "application/json") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString("utf-8");
    });

    req.on("end", () => {
      //console.log("raw body: ", body);
      body = JSON.parse(body);
      req.body = body;
      return next();
    });
  } else {
    next();
  }
};
const cors = (req, res, next) => {
  if (req.method === "OPTIONS") {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE',
      'access-control-allow-headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
  }
  else {
    res.setHeader('access-control-allow-origin', '*');
    next();
  }
}
class TrieNode {
  constructor() {
    this.children = new Map();
    this.callback = new Map();
    this.paramChild = null;
  }
}
//handling routes
const handleRoutes = (routes, req, method) => {
  const reqPath = req.split("/");
  // O(n) implementation
  // for (let i = 0; i < routes.length; i++) {
  //   if (routes[i].method !== method) {
  //     continue;
  //   }
  //   if (routes[i].segPath.length !== reqPath.length) {
  //     continue;
  //   }
  //   let match = true;
  //   let params = {};
  //   for (let j = 0; j < routes[i].segPath.length; j++) {
  //     if (routes[i].segPath[j][0] === ":") {
  //       const paramName = routes[i].segPath[j].slice(1);
  //       const value = reqPath[j];
  //       params[paramName] = value;
  //     }
  //     else if (routes[i].segPath[j] !== reqPath[j]) {
  //       match = false;
  //       break;
  //     }

  //   }
  //   if (match) {
  //     return { handler: routes[i].cb, params };
  //   }
  // }
  // return null;
}
class RadixTree {
  constructor() {
    this.root = new TrieNode();
  }
  insert(method, path, cb) {
    path = path.split("/").filter(Boolean);
    let cur = this.root;
    if (path.length === 0) {
      cur.callback.set(method, cb);
      return;
    }
    const lastSegment = path[path.length - 1];
    for (const segment of path) {
      if (segment[0] === ":") {
        cur.paramChild = { name: segment.slice(1), node: new TrieNode() };
        cur = cur.paramChild.node;
      }
      else if (!cur.children.has(segment)) {
        cur.children.set(segment, new TrieNode());
        cur = cur.children.get(segment);
      } else cur = cur.children.get(segment);

      if (segment === lastSegment) {
        cur.callback.set(method, cb);
      }

    }
  }
  match(method, path) {
    path = path.split("/").filter(Boolean);
    let cur = this.root;
    const params = {};
    if (path.length === 0) {
      if (!cur.callback.get(method)) return null;
      return { handler: cur.callback.get(method), params };
    }
    const lastSegment = path[path.length - 1];

    for (const segment of path) {
      //static takes precedence over dynamic
      if (cur.children.has(segment)) {
        cur = cur.children.get(segment);
      }
      else if (cur.paramChild) {
        params[cur.paramChild.name] = segment;
        cur = cur.paramChild.node;
      }
      else return null;
      if (segment === lastSegment) {
        if (!cur.callback.get(method)) return null;
        return { handler: cur.callback.get(method), params };
      }
    }
    return null;
  }
}


export { parseJSON, handleRoutes, cors, RadixTree };