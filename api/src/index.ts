import { makeApp } from "./app.js";
import { defaultStore } from "./store.js";

const PORT = process.env.PORT || 4000;

const app = makeApp(defaultStore);

app.listen(PORT, () => {
  console.log(`Aurora Conflicts API listening on http://localhost:${PORT}`);
});
