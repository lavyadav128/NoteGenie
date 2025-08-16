// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const Groq = require("groq-sdk");
const nodemailer = require("nodemailer");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());


app.use(cors({
    origin: [
      'http://localhost:5173',          
      'https://notegenie-2.onrender.com',        
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],    
    credentials: true,                           
    allowedHeaders: ['Content-Type', 'Authorization'], 
  }));

// Only allow .txt uploads
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "text/plain") {
      return cb(new Error("Only .txt files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Groq API setup
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_HOST_SERVICE, 
  auth: {
    user: process.env.EMAIL_HOST_USER,
    pass: process.env.EMAIL_HOST_PASS,
  },
});

// --- Summarize Endpoint ---
app.post("/api/summarize", upload.single("transcriptFile"), async (req, res) => {
  try {
    if (!req.file || !req.body.prompt) {
      return res.status(400).json({ error: "Transcript file (.txt) and prompt are required." });
    }

    // Read uploaded .txt file content
    const transcriptText = fs.readFileSync(req.file.path, "utf-8");
    const userPrompt = req.body.prompt;

    const content = `Summarize the following transcript based on this instruction: "${userPrompt}"\n\nTranscript:\n${transcriptText}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content }],
      model: "llama-3.1-8b-instant", 
    });

    const summary = chatCompletion.choices[0]?.message?.content || "No summary generated.";

    res.json({ summary });
  } catch (error) {
    console.error("Error during summarization:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Share via Email Endpoint ---
app.post("/api/share", async (req, res) => {
  try {
    const { summary, recipients } = req.body;
    if (!summary || !recipients) {
      return res.status(400).json({ error: "Summary and recipients are required." });
    }

    const mailOptions = {
      from: process.env.EMAIL_HOST_USER,
      to: recipients.join(","),
      subject: "Meeting Summary",
      html: `<h3>Meeting Summary</h3><p>${summary}</p>`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => console.log(`✅ Server running at http://localhost:${port}`));
