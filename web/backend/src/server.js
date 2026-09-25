import { createApp } from "./app.js";

const app = createApp();
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`NOHAYO companion backend listening on http://localhost:${port}`);
});
