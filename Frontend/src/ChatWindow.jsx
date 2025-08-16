import React, { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Divider,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send";

function ChatWindow() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [recipients, setRecipients] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSummary("");

    if (!file || !prompt) {
      setError("Please upload a .txt transcript and enter a prompt.");
      return;
    }

    const formData = new FormData();
    formData.append("transcriptFile", file);
    formData.append("prompt", prompt);

    try {
      const res = await fetch("http://localhost:5000/api/summarize", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  const handleShare = async () => {
    if (!recipients || !summary) {
      setError("Enter recipient email(s) and generate a summary first.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, recipients: recipients.split(",") }),
      });

      if (!res.ok) throw new Error("Failed to send email");
      alert("✅ Email sent successfully!");
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to send email.");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom align="center">
          📄 Meeting Summarizer
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
            >
              Upload Transcript
              <input
                type="file"
                accept=".txt"
                hidden
                onChange={(e) => setFile(e.target.files[0])}
              />
            </Button>
            {file && (
              <Typography variant="body2" color="text.secondary">
                {file.name}
              </Typography>
            )}
          </Box>

          <TextField
            label="Enter your prompt"
            fullWidth
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            endIcon={<SendIcon />}
          >
            Generate Summary
          </Button>
        </form>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {summary && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6">Summary (Editable)</Typography>
            <TextField
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              multiline
              rows={8}
              fullWidth
              sx={{ mt: 1 }}
            />

            <TextField
              label="Recipient emails (comma separated)"
              fullWidth
              sx={{ mt: 2 }}
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
            />

            <Button
              variant="contained"
              color="success"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleShare}
            >
              Share via Email
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
}

export default ChatWindow;
