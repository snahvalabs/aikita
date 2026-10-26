AIKITA Ollama Configuration Guide
================================

This guide explains how to configure Ollama (or any OpenAI-compatible LLM) to work with AIKITA.

## Prerequisites

- Ollama installed and running
- At least one LLM model downloaded
- AIKITA application running (pnpm start)

## 1. Install Ollama

Download and install Ollama from: https://ollama.com/download

### Operating Systems:

#### Windows
- Download the Windows installer from the Ollama website
- Run the installer and follow the setup wizard
- After installation, open Command Prompt or PowerShell
- Run: `ollama serve` to start the server
- Verify: Open browser to `http://127.0.0.1:11434/api/tags`

#### macOS
- Using Homebrew: `brew install ollama`
- Or download from: https://ollama.com/download
- Run: `ollama serve` in Terminal
- Verify: Open browser to `http://127.0.0.1:11434/api/tags`

#### Linux (Ubuntu/Debian)
- Using curl: `curl -fsSL https://ollama.com/install.sh | sh`
- Or download from: https://ollama.com/download
- Run: `ollama serve`
- Verify: Open browser to `http://127.0.0.1:11434/api/tags`

### Alternative LLM Runtimes (also supported)
- LM Studio: https://lmstudio.ai/
- llama.cpp: https://github.com/ggerganov/llama.cpp
- OpenAI-compatible endpoints

## 2. Download LLM Models

After Ollama is running, download at least one model:

```bash
# Pull the recommended model for AIKITA
ollama pull llama3.2

# Other good options:
ollama pull mistral      # 7B parameters, good balance
ollama pull phi3         # 3.8B parameters, very fast
ollama pull gemma        # 2B/7B parameters, Google model
```

Verify installed models:
```bash
ollama list
```

Expected output:
```
NAME              ID              SIZE
llama3.2          abc123...         2.0B
mistral           def456...         4.1B
```

## 3. Configure AIKITA to Connect to Ollama

### Method A: Using Environment Variables (.env)

Create or edit the `.env` file in the AIKITA root directory:

```env
# LLM Configuration
AIKITA_LLM_URL=http://127.0.0.1:11434
AIKITA_LLM_MODEL=llama3.2
AIKITA_LLM_API_KEY=""          # Leave empty for Ollama local
AIKITA_LLM_TIMEOUT_MS=20000    # 20 seconds timeout

# Document ingestion mode
AIKITA_INGESTION_MODE=ocr      # or "langchain"
```

### Method B: Using AIKITA UI (Settings Page)

1. Start AIKITA: `pnpm run dev` or `pnpm start`
2. Login as admin (or register a new admin account)
3. Navigate to: `http://127.0.0.1:3000/settings`
4. Configuration steps:

   a. **Toggle LLM**: Enable the "Aktif" switch
   
   b. **URL server**: Enter `http://127.0.0.1:11434` (or your Ollama address)
   
   c. **Nama model**: 
      - Click "Uji koneksi" button
      - AIKITA will fetch available models from Ollama
      - Select `llama3.2` or your preferred model from the dropdown
   
   d. **Kata sandi API**: 
      - Kosongkan (kosong) untuk Ollama lokal
      - Isi hanya jika model membutuhkan kunci API (tidak umum untuk Ollama)
   
   e. **Batas waktu (milidetik)**: 
      - Default: 20000 (20 detik)
      - Sesuaikan jika respons lambat (antara 2000-300000)

5. Klik "Simpan pengaturan" 
6. Klik "Uji koneksi" to verify connection
7. Should see "Terhubuk · http://127.0.0.1:11434" with model list

## 4. Test the Connection

### Using AIKITA UI
1. Go to Settings page
2. Click "Uji koneksi"
3. Check results:
   - ✅ **Success**: Shows "Terhubung" with model list
   - ❌ **Failed**: Shows error message with details

### Using Command Line
```bash
# Test Ollama directly
curl http://127.0.0.1:11434/api/tags

# Expected JSON response:
{
  "model": "llama3.2",
  "modified_at": "2024-01-01T00:00:00Z",
  "size": 2000000000,
  "digest": "sha256:abc123..."
}
```

## 5. Using AIKITA with Ollama

Once connected, AIKITA will:

1. **Use LLM for answers**: When you ask questions, AIKITA will use the connected LLM to generate responses based on document content
2. **Include citations**: Answers will have source markers like `[1]`, `[2]`
3. **Language**: Responses in Indonesian (as configured in the system prompt)
4. **Fallback**: If LLM fails, AIKITA gracefully falls back to keyword-based text extraction

### Example Usage

After setup, you can:

- Ask questions about your documents: "Apa kebijakan penggunaan asisten dokumen?"
- Get summarized answers with source references
- Use the chat interface normally
- The LLM will enhance answers with contextual information from documents

## 6. Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| "Server merespons 404" | Check URL: should be `http://127.0.0.1:11434`, not port 11424 or other |
| "Tidak dapat terhubung ke server LLM lokal" | Ensure `ollama serve` is running |
| Empty model list | Run `ollama pull <model_name>` to download a model |
| Connection timeout | Increase `AIKITA_LLM_TIMEOUT_MS` in .env (try 30000-60000) |
| "Authorization failed" | If using API key, ensure it's correct; for Ollama local, leave empty |

### Logs
- Check Ollama logs: `ollama logs`
- Check AIKITA terminal output for connection errors
- Browser console (F12) for frontend errors

## 7. Production Considerations

- **Multiple models**: Can configure different models for different tasks
- **Resource usage**: LLM models consume RAM; ensure sufficient memory (2GB+ recommended for llama3.2)
- **Security**: Ollama listens on localhost by default (127.0.0.1), not exposed to network
- **Backup**: Regularly backup `data/aikita.db` for database persistence
- **Model updates**: Run `ollama pull <model>` to update to newer versions

## 8. Quick Start Checklist

- [ ] Ollama installed (`ollama --version` works)
- [ ] Ollama running (`ollama serve` in background)
- [ ] At least one model downloaded (`ollama list` shows models)
- [ ] AIKITA `.env` configured with correct URL and model
- [ ] AIKITA started (`pnpm start`)
- [ ] Login as admin
- [ ] Settings → AI Connection: connection tested and confirmed
- [ ] Ask first question to verify LLM integration

