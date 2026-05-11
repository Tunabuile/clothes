import { captionImage } from "./lib/huggingface.js";
import fs from "fs";

// create a simple red pixel base64
const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function run() {
  try {
    const res = await captionImage(dummyBase64);
    console.log("Caption result:", res);
  } catch (e) {
    console.error("Caption error:", e);
  }
}

run();
