import WebSocket from "ws";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("No API KEY");
  process.exit(1);
}

const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log("Connected!");
  
  const setupMessage = {
    setup: {
      model: "models/gemini-2.0-flash-exp",
      systemInstruction: {
        parts: [{ text: "Você é um bot de teste." }]
      },
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Puck" }
          }
        }
      }
    }
  };
  
  ws.send(JSON.stringify(setupMessage));
  
  setTimeout(() => {
    console.log("Sending first message...");
    ws.send(JSON.stringify({
      clientContent: {
        turns: [{ role: "user", parts: [{ text: "Olá!" }] }],
        turnComplete: true
      }
    }));
  }, 10000);

  setTimeout(() => {
    console.log("Sending second message...");
    ws.send(JSON.stringify({
      clientContent: {
        turns: [{ role: "user", parts: [{ text: "Oie denovo" }] }],
        turnComplete: true
      }
    }));
  }, 15000);
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  if (response.serverContent) {
     if (response.serverContent.modelTurn) {
         const parts = response.serverContent.modelTurn.parts;
         const text = parts.find(p => p.text)?.text;
         if (text) process.stdout.write(text);
     }
     if (response.serverContent.turnComplete) {
         console.log("\n[TURN COMPLETE]");
     }
  } else {
     console.log("Event:", JSON.stringify(response));
  }
});

ws.on('close', (code, reason) => {
  console.log("Closed:", code, reason.toString());
});
