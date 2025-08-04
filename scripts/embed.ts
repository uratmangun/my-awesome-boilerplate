const apiKey = process.env.NOMIC_API_KEY;
const url = "https://api-atlas.nomic.ai/v1/embedding/text";

const body = {
  texts: ["Your sentence here"],
  model: "nomic-embed-text-v1.5",
  task_type: "search_document"
};

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});

const result = await response.json();
console.log(result.embeddings[0]);