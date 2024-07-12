const express = require("express");

const apiKey = "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";
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: apiKey });
const fs = require('fs');
const app = express();
app.use(express.json());

const instrutions =`You are now a Swiggy bot, equipped with a comprehensive dataset of Indian foods including their categories, subcategories, dishes, restaurant names, pricing, ratings, discounts, and delivery times. Your goal is to assist users in finding their favorite food based on their mood and preferences.

**Sample Interaction:**

Swiggy Bot: "Hey there! I'm your friendly Swiggy bot. What are you in the mood to eat today? Whether you're craving something spicy, sweet, or healthy, I can help you find the perfect dish!"

User: "I'm in the mood for something spicy."

Swiggy Bot: "Great choice! How about some spicy biryani from Biryani House? It's highly rated and currently has a 20% discount. Would you like to see more options?"

**Additional Information for the Bot:**
- Greet the user warmly.
- Ask about their food preferences or mood.
- Suggest popular dishes based on the user's mood.
- Highlight any available discounts and deals.
- Mention delivery times and ratings to help the user decide.
- Offer to provide more options if the user isn't satisfied with the first suggestion.

By following these guidelines, you can provide a personalized and engaging experience for the user, helping them find the perfect meal to match their cravings.
`;
app.post("/builtin", async (req, res) => {  
  try {
    const assistant = await openai.beta.assistants.create({
      name: "Swiggy Chat Bot",
      instructions: instrutions,
      tools: [{ type: "file_search" }],
      model: "gpt-4o",
    });
    await openai.beta.assistants.update(assistant.id, {
      tool_resources: {
        file_search: { vector_store_ids: ["vs_x1QoC2252vEiyv8unkzpX3jn"] },
      },
    });
    const thread = await openai.beta.threads.create();
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: "hey",
    });
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
      instructions: instrutions
    });
    res.status(500).send(`Assistant Created: ${run.id} ${run.assistant_id} ${thread.id}`);
  } catch (error) {
    console.error("Error communicating with OpenAI:", error);
    res
      .status(500)
      .send(error.response ? error.response.data : "An error occurred");
  }
});

app.post("/send_message", async (req, res) => {
    const message = req.body.txt;
    const threadid = req.body.threadid;
    const assistantid = req.body.assistantid;
    try {
      await openai.beta.threads.messages.create(threadid, {
        role: "user",
        content: message,
      });
      const run = await openai.beta.threads.runs.create(threadid, {
        assistant_id: assistantid,
      });
      res.status(500).send("Message Sent");
    } catch (error) {
      console.error("Error communicating with OpenAI:", error);
      res
        .status(500)
        .send(error.response ? error.response.data : "An error occurred");
    }
  });


  app.post("/getmessages", async (req, res) => {
    const threadid = req.body.threadid;
    try {
      const message = await openai.beta.threads.messages.list(threadid);
      message.body.data.forEach((messages) => {
        console.log(messages.content);
      });
      res.status(500).send({
        message1: formatMessage(message.body.data[1].content[0].text.value),
        message2: formatMessage(message.body.data[0].content[0].text.value),
      });
    } catch (error) {
      console.error("Error communicating with OpenAI:", error);
      res
        .status(500)
        .send(error.response ? error.response.data : "An error occurred");
    }
  });
  const formatMessage = (text) => {
    // Replace newline characters with <br> tags
    let formattedText = text.replace(/\n/g, "");
  
    // Replace text wrapped in ** with HTML bold tags
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, "$1");
  
    return formattedText;
  }; 


  app.post("/upload_file", async (req, res) => {
    try {
      // Check if the file exists before creating a read stream
      const filePath = "./foods.json";
      if (!fs.existsSync(filePath)) {
        return res.status(400).send(`File ${filePath} does not exist`);
      }
  
      // Create a read stream for the file
      const fileStreams = [fs.createReadStream(filePath)];
  
    if (!fileStreams || fileStreams.length === 0) {
        console.error('No files to upload');
        return res.status(400).send('No files to upload');
      }
      console.log('File streams created:', fileStreams);
      // Create a vector store
      let vectorStore = await openai.beta.vectorStores.create({
        name: "Swiggy Food Data",
      });
      console.log(fileStreams);
      // Upload and poll the file batch
      await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, {
        files: fileStreams,
        });
      res.status(200).send(`Vector ID ${vectorStore.id}`);
    } catch (error) {
      console.error(error);
      res.status(500).send(`Error: ${error.message}`);
    }
  });

  app.post("/check_assisstabt", async (req, res) => {
    const myThread = await openai.beta.assistants.retrieve(
      "asst_nNlvQegfiwYsgaylj4B5EdZj"
    );
  
    console.log(myThread);
  
res.status(500).send("Check Thread");
});

app.post("/reterive_message", async (req, res) => {
    const message = await openai.beta.threads.runs.retrieve(
        "thread_bzg7iijny992cI7iBcirlkqj",
        "run_fXpQVkl26iYMqfYXz1vWde7h"
      );
 console.log(message);
res.status(500).send("Message Recevied");
});



app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
  
  // asst_nNlvQegfiwYsgaylj4B5EdZj  thread_8C3lHJSvM1fug3iIcCIz7ALR

  // run_fXpQVkl26iYMqfYXz1vWde7h asst_0m9NUfsbFf5QohjX0PXWJl7L thread_bzg7iijny992cI7iBcirlkqj