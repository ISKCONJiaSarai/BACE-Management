const fs = require('fs');
const readline = require('readline');

async function main() {
  const fileStream = fs.createReadStream('C:/Users/surya/.gemini/antigravity-ide/brain/01941524-2b0b-4f88-8e17-11313ec3ea81/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const userMessages = [];
  const modelMessages = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT') {
        userMessages.push({ step: obj.step_index, content: obj.content });
      } else if (obj.type === 'PLANNER_RESPONSE' && obj.content) {
        modelMessages.push({ step: obj.step_index, content: obj.content.slice(0, 300) });
      }
    } catch (e) {}
  }

  console.log("=== LAST 3 USER MESSAGES ===");
  console.log(JSON.stringify(userMessages.slice(-3), null, 2));

  console.log("=== LAST 3 MODEL MESSAGES ===");
  console.log(JSON.stringify(modelMessages.slice(-3), null, 2));
}

main();
