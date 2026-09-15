import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 8000);
createApp().listen(port, () => console.log(`atithya api on http://localhost:${port}`));
