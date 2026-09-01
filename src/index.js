import cpeak, { parseJSON, cors } from "../cpeak/index.js";
import apiRouter from "./router.js";

const PORT = 8020;

const server = new cpeak();

// ------ Middlewares ------ //
server.beforeEach(cors);
// For parsing JSON body
server.beforeEach(parseJSON);

server.errorHandler((error, req, res) => {
  if (error && error.status) {
    res.status(error.status).json({ error: error.message });
  } else {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
})


// ------ API Routes ------ //
apiRouter(server);



server.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});
