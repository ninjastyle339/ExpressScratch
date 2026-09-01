import http from "node:http";
import fs from "node:fs/promises";

import { parseJSON } from "./util.js";
import { handleRoutes, RadixTree, cors } from "./util.js";
class Cpeak {
  constructor() {
    this.server = http.createServer();
    this.routes = new RadixTree();
    this.middleware = [];

    this.server.on("request", (req, res) => {

      // Send a file back to the client
      res.sendFile = async (path, mime) => {
        const fileHandle = await fs.open(path, "r");
        const fileStream = fileHandle.createReadStream();

        res.setHeader("Content-Type", mime);

        fileStream.pipe(res);
      };

      // Set the status code of the response
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };

      // Send a json data back to the client (for small json data, less than the highWaterMark)
      res.json = (data) => {
        // This is only good for bodies that their size is less than the highWaterMark value
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      };



      const urlWithoutParams = req.url.split("?")[0];
      req.query = new URLSearchParams(req.url.split("?")[1]);

      // Run all the middleware functions before we run the corresponding route
      const runMiddleware = (req, res, middleware, index) => {
        // Out exit point...
        if (index === middleware.length) {
          const handleRoute = this.routes.match(req.method.toLowerCase(), urlWithoutParams);
          //const handleRoute = handleRoutes(this.routes, urlWithoutParams, req.method.toLowerCase());
          // If the routes object does not have a key of req.method + req.url, return 404
          if (!handleRoute) {
            return res
              .status(404)
              .json({ error: `Cannot ${req.method} ${urlWithoutParams}` });
          }
          try {
            req.params = handleRoute.params;
            const handlerResult = handleRoute.handler(req, res, (error) => {
              res.setHeader("Connection", "close");
              this._errorHandler(error, req, res);
            });
            if (handlerResult && typeof handlerResult.then === "function") {
              handlerResult.catch((error) => {
                res.setHeader("Connection", "close");
                this._errorHandler(error, req, res);
              });
            }
          } catch (error) {
            res.setHeader("Connection", "close");
            this._errorHandler(error, req, res);
          }
        } else {
          middleware[index](req, res, () => {
            runMiddleware(req, res, middleware, index + 1);
          });
        }
      };

      runMiddleware(req, res, this.middleware, 0);
    });
  }

  route(method, path, cb) {
    this.routes.insert(method.toLowerCase(), path, cb);
  }

  beforeEach(cb) {
    this.middleware.push(cb);
  }

  errorHandler(cb) {
    this._errorHandler = cb;
  }

  listen(port, cb) {
    this.server.listen(port, () => {
      cb();
    });
  }
}

export { parseJSON, cors };

export default Cpeak;