AIKITA User Guide
================

This guide explains how to use AIKITA after installation and configuration.

## Quick Start

### 1. Start AIKITA
```bash
# From the AIKITA directory
pnpm start
```

Or using development mode:
```bash
pnpm run dev
```

Application will be available at: http://127.0.0.1:3000

### 2. Login
- Access the login page at: http://127.0.0.1:3000/login
- Enter username and password
- **Default admin credentials** (if not changed):
  - Username: `admin`
  - Password: (set during first setup or use your registered account)
- Click "Masuk →"

### 3. First-Time Setup (if prompted)
If this is the first run, you may see a setup gate. As admin:
- Click "Siapkan folder referensi"
- Upload or add initial documents
- Activate reference documents
- The system will initialize the knowledge base

## Interface Overview

### Sidebar Navigation
The left sidebar contains the main navigation:

| Icon | View | Description |
|------|------|-------------|
| 💬 | Asisten AI | Main chat interface with AI |
| 📚 | Pustaka dokumen | Document library management |
| ✨ | Studio Dokumen | Document studio for summaries, flashcards, etc. |
| 👥 | Kelola pengguna | User account management (admin only) |
| 📊 | Log aktivitas | Activity audit log (admin only) |
| ⚙️ | Pengaturan AI | AI configuration and settings |

### Top Bar
- **Brand**: "aikita - FRAYAS ACADEMY" (click home)
- **Status indicator**: Shows local runtime status
- **Berjalan locally**: Badge indicating local-only operation
- **User menu**: Avatar with name, role, logout button

## Using the AI Assistant (Chat)

### Basic Usage
1. Type your question in the textarea at the bottom
2. Press Enter (or click the send arrow ⬆)
3. Wait for AIKITA to analyze and respond
4. View the answer with source citations

### Example Questions
- "Apa kebijakan penggunaan asisten dokumen?"
- "Ringkas SOP pengelolaan arsip digital untuk presentasi"
- "Buat tabel prosedur pengajuan pelatihan anggota"
- "Telusuri alur penyusunan surat dinas"

### Response Format
- **Text answers**: Normal paragraph format with citations like `[1]`, `[2]`
- **Table format**: If question contains "tabel" or "table", response will be a table
- **Image format**: For visual content, AIKITA can generate reference maps
- **Citations**: Each answer includes source document references

### Suggested Questions
The interface provides example questions you can click:
- "Pahami tata naskah" - Understand manuscript structure
- "Ringkas dalam tabel" - Create tables from procedures
- "Siapkan paparan" - Prepare presentation materials
- "Pelajari kebijakan" - Learn document policies

## Managing Documents (Pustaka)

### Uploading Documents
1. Navigate to "Pustaka dokumen" in the sidebar
2. Click "Unggah dokumen" button (plus icon)
3. Select file to upload:
   - Supported formats: TXT, DOCX, PDF
   - Maximum size: 15 MB per file
   - Mode selection: OCR or LangChain (configured in settings)
4. Enter document title (max 160 characters)
5. Optionally add content/reference text
6. Set classification: "Internal" or "Terbatas (demo)"
7. Click "Simpan & aktifkan" (admin) or "Kirim untuk ditinjau" (members)

### Document Status
- **Aktif**: Document is available for searching and AI queries
- **Menunggu**: Submitted by member, awaiting admin approval
- **Arsip**: Document is archived but still accessible

### Searching Documents
- Use the search bar at the top of the document library
- Filter by category if available
- View document list with status indicators
- Click on a document title to view its contents

## Studio Dokumen Feature

### Accessing Studio
1. Click "Studio Dokumen" in the sidebar
2. Or use the navigation dropdown to switch to studio view

### Available Tools
The studio provides document analysis capabilities:

#### 1. Ringkasan Ekstraktif
- Generates concise summaries of document content
- Highlights key points and main ideas
- Useful for quick overviews

#### 2. Infografis
- Creates visual infographics from document data
- Presents information in chart/graph format
- Good for presentations and reports

#### 3. Slide Presentasi
- Generates PowerPoint-style slides
- Organizes content into slide format
- Includes source citations on each slide

#### 4. Flashcard
- Creates flashcards for learning and review
- Question-answer format based on content
- Good for memorization and training

#### 5. Peta Referensi
- Generates reference maps visualizing document structure
- Shows relationships between sections
- Useful for understanding document architecture

### How to Use Studio Tools
1. Select a document from the library or upload new one
2. Choose the desired output type from the available options
3. Wait for processing (may take a few seconds for large documents)
4. Download or export the generated file
5. Review and refine as needed

## User Accounts and Roles

### Admin Role
Administrators have full access to:
- Manage user accounts (create, update, delete)
- Configure AI settings (Ollama connection, ingestion mode)
- Approve/document review uploaded files
- Delete documents from library
- Access audit logs
- Set document classifications

### Anggota Role
Members have limited access:
- Can ask questions about documents
- Can upload documents (pending admin approval)
- Can view their own uploaded documents
- Cannot manage other users or settings
- Cannot delete documents from library

### Managing Accounts (Admin Only)
1. Go to "Kelola pengguna" in the sidebar
2. View list of registered users
3. Actions available:
   - **Atur ulang sandi**: Reset password for a user
   - **Nonaktifkan/Aktifkan**: Toggle user status
   - **Hapus**: Permanently delete account (cannot delete own account if active)
   - **Perbarui role**: Change user role between Admin/Anggota

### Default Account
- First admin account created during initial setup
- Credentials stored locally (hashed scrypt, not plain text)
- Can be managed through the UI or command line

## AI Configuration (Settings)

### Accessing Settings
1. Click "Pengaturan AI" in the sidebar
2. Or navigate to `http://127.0.0.1:3000/settings`

### Configuration Sections

#### 1. Koneksi LLM Lokal (Ollama)
- **Toggle Aktif**: Enable/disable LLM usage
- **URL server**: Address of Ollama server (default: `http://127.0.0.1:11434`)
- **Nama model**: Select from available Ollama models
- **Kata sandi API**: Leave empty for local Ollama
- **Batas waktu**: Timeout in milliseconds (2000-300000, default: 20000)

#### 2. Mode Baca Dokumen
- **OCR (Tesseract)**: 
  - Reads PDF scans/image-based documents
  - Uses OCR to extract text
  - Supports Indonesian and English
  - Slower but handles scanned documents

- **LangChain**:
  - Pipeline: Document Loader → Text Splitter → Retriever → QA Chain
  - Only works with digitally text PDFs (no OCR needed)
  - Faster for text-based documents
  - Includes chunking and similarity search

- **Switching modes**: Changes apply to all future document readings
- **Info note**: Mode setting affects reference setup, uploads, and studio features

#### 3. Additional Settings
- Model timeout adjustment
- API key configuration (if required)
- Model selection from fetched list

### Saving Changes
- Click "Simpan pengaturan" after making changes
- Changes are saved to the database (`settings` table)
- No application restart needed
- Settings persist across sessions

## Troubleshooting

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| **Halaman tidak dimuat** | Refresh page, check if `pnpm start` is running |
| "Silakan login dahulu" | Go to login page and enter credentials |
| "Penyimpanan belum tersedia" | Wait a moment, may be initializing database |
| No response from AI | Check Ollama is running: `ollama serve` |
| Empty model list | Pull model: `ollama pull llama3.2` |
| Answer not relevant | Check document is "Aktif" status, verify ingestion mode |
| OCR not working on PDFs | Ensure PDF has text layer, or use OCR mode |
| "Dokumen tidak terbaca" | Check document format, size limits (15MB, 300KB text) |
| Slow performance | Reduce model size, increase timeout, check document size |
| Login not working | Verify username/password, check account status |

### Checking Ollama Status
```bash
# Verify Ollama is running
ollama serve

# List models
ollama list

# Test endpoint
curl http://127.0.0.1:11434/api/tags
```

### Checking AIKITA Logs
- Terminal where `pnpm start` is running
- Look for connection errors, database initialization messages
- Browser F12 console for frontend errors

### Database Maintenance
- Regularly backup `data/aikita.db`
- Clean up old documents if storage becomes full
- Remove unused accounts to free resources
- Audit logs are kept for 100 entries maximum

## Export and Sharing

### Export Options
AIKITA supports exporting in multiple formats:

1. **Word (.docx)**
   - Click "Word" button on any answer
   - Generates formatted document with citations
   - Good for reports and documentation

2. **PowerPoint (.pptx)**
   - Click "PowerPoint" button on any answer
   - Creates presentation slides
   - Includes source references on slides

3. **Image (PNG)**
   - Click "Gambar" button on any answer
   - Generates reference map visualization
   - Shows source document relationships

4. **Text (.txt)**
   - Click "Unduh sumber TXT" on any document
   - Downloads raw text content
   - Useful for external processing

### Sharing Results
- Copy answer text to clipboard (copy button available)
- Share exported files via email, Teams, etc.
- Export summaries for meetings or reports
- Share flashcards for training purposes

## Security and Privacy

### Data Storage
- **Documents**: Stored in `data/blobs/` directory
- **Database**: SQLite at `data/aikita.db`
- **User accounts**: Hashed passwords (scrypt algorithm)
- **Audit logs**: Activity tracking for admin oversight

### Local-Only Operation
- AIKITA runs entirely on your machine
- No data sent to external servers (unless LLM is configured to do so)
- Ollama runs locally by default (127.0.0.1:11434)
- SQLite database is file-based, no external database server needed

### Recommended Security Practices
1. Keep Ollama and AIKITA updated
2. Use strong passwords for user accounts
3. Regularly backup the database (`data/aikita.db`)
4. Restrict network access to Ollama (it's localhost only by default)
5. Monitor audit logs for unusual activity
6. Don't store sensitive/confidential documents without encryption

### If Compromised
- Immediately change all passwords
- Review audit logs for unauthorized access
- Revoke and recreate API keys if using external LLMs
- Backup important documents before resetting
- Contact support if needed (for deployment-specific issues)

## FAQ (Frequently Asked Questions)

### Q: Do I need an internet connection to use AIKITA?
A: No, AIKITA runs entirely locally. Internet is only needed initially to download Ollama and models, or if connecting to external LLM endpoints.

### Q: Can I use AIKITA with my own LLM API key?
A: Yes! Configure the API key in Settings → AI Connection. AIKITA supports any OpenAI-compatible endpoint.

### Q: What types of documents can I upload?
A: TXT, DOCX, and PDF files (max 15MB each). PDFs can be text-based or scanned images (with OCR mode).

### Q: How many users can use AIKITA simultaneously?
A: As many as your machine can handle. SQLite supports concurrent reads, but heavy LLM usage may slow responses.

### Q: Can I switch between OCR and LangChain modes?
A: Yes, change in Settings → Mode baca dokumen. Mode applies to all future document readings.

### Q: What if my PDF has no text layer?
A: Use OCR mode. AIKITA will scan pages using Tesseract (Indonesian + English supported).

### Q: How do I update the LLM model?
A: Run `ollama pull <new_model_name>` in terminal, then select new model in AIKITA Settings.

### Q: Can I use AIKITA on multiple computers?
A: Yes, but each installation has its own database. Consider using shared storage for `data/` folder if needing consistent data.

### Q: What happens if Ollama crashes during a chat?
A: AIKITA gracefully falls back to keyword-based text extraction. You'll get answers without LLM enhancement but still with source citations.

### Q: Is there a mobile app version?
A: AIKITA is web-based and works on mobile browsers. No separate mobile app, but interface adapts to screen size.

### Q: Can I customize the system prompt/behavior?
A: The system prompt is hardcoded for consistency, but you can influence behavior through:
- Document content quality
- Proper categorization and tagging
- Good question phrasing
- Settings adjustments

### Q: How do I reset all settings to defaults?
A: Delete or reset the `data/aikita.db` database file and `.env` file, then restart. All data will be lost and need re-setup.

### Q: Can I integrate AIKITA with other systems?
A: The API endpoints are available at `/api/workspace` and `/api/auth`. For programmatic access, contact deployment specialist.

### Q: What's the difference between OCR and LangChain modes?
A:
- **OCR**: Reads scanned PDFs/images, slower, handles image-based content
- **LangChain**: Only text-based digital PDFs, faster, includes retrieval pipeline with chunking and similarity search

### Q: How much disk space does AIKITA need?
A: Minimum 2GB for comfortable operation:
- 500MB for application and dependencies
- 500MB for SQLite database
- 500MB-2GB for document storage (depends on number/size)
- 2GB+ for LLM model (llama3.2 is ~2GB)

### Q: Can I run AIKITA as a service/daemon?
A: Yes, use `pnpm start` in background or with a process manager (pm2, systemd). For production, consider containerization (Docker).

### Q: Does AIKITA support languages other than Indonesian?
A: The interface and system prompt are in Indonesian, but:
- OCR supports Indonesian and English
- LLM can respond in many languages based on model capabilities
- Document content can be in any language
- Search and citations work with Unicode text

### Q: What if I exceed the text limits?
A: 
- 15MB per document upload limit
- 300,000 character text limit per document
- 4,000 character question limit
- 1,800,000 character library capacity warning
- 900,000 character workspace capacity warning

 beyond these limits, the application will show error messages and refuse operations.

### Q: Can I customize the sidebar navigation?
A: The sidebar is predefined, but you can hide/show sections through:
- Role-based visibility (admin sees more options)
- View switching (different sections shown per view)
- Custom configurations not currently supported in UI

### Q: How are citations generated?
A: When LLM is active, answers include `[1]`, `[2]` markers referencing source documents. Without LLM, citations are based on keyword matching from the retrieve function.

### Q: Can I use AIKITA offline completely (no Ollama)?
A: Yes! AIKITA fully works without LLM. You'll get:
- Keyword-based answers from documents
- Source citations
- All features except LLM-enhanced responses
- Perfect for internal knowledge bases without AI overhead

### Q: What's the recommended hardware specification?
A:
- **Minimum**: 4GB RAM, 2-core CPU
- **Recommended**: 8GB RAM, 4-core CPU
- **LLM model**: 2GB-8GB RAM depending on model size
- **Storage**: 5GB+ SSD/HDD for database and documents
- **OS**: Windows 10+/macOS 10.15+/Ubuntu 20.04+

### Q: Can I use custom system prompts?
A: Currently the system prompt is fixed for AIKITA consistency. For custom prompts, you would need to modify the `lib/local-llm.ts` file and rebuild the application.

### Q: Is there a limit on how many documents I can have?
A: Practically, depends on your storage and performance:
- SQLite can handle hundreds of documents
- LLM context limits apply (typically 2K-8K tokens per request)
- Library capacity warnings at 1.8M characters
- Performance degrades with very large document sets
- Consider partitioning or archiving old documents

### Q: Can I contribute to AIKITA development?
A: AIKITA is open source (if applicable). Check the repository for contribution guidelines. Generally:
- Report bugs and feature requests
- Submit pull requests for bug fixes
- Improve documentation
- Test new features
- Share use cases and feedback

### Q: How do I cite AIKITA in my work?
A: Suggested citation:
```
AIKITA. (2024). Asisten Pengetahuan Lokal. Frayas Academy. 
Available at: http://localhost:3000 (accessed: DATE)
```

### Q: Can I export my entire knowledge base?
A: Currently no bulk export feature. You can:
- Export individual documents as TXT/DOCX/PPTX
- Export chat histories manually
- Export specific summaries or analyses
- Database file (`data/aikita.db`) contains all data (SQLite format)

### Q: What happens if two admins try to configure at the same time?
A: Changes are saved to the database with locking. Concurrent changes may cause conflicts, but the last save wins. Recommend coordinating admin actions.

### Q: Can I use AIKITA with Windows Subsystem for Linux (WSL)?
A: Yes! AIKITA works on WSL2. Note:
- Ollama can run on WSL2
- File paths should use WSL-style paths
- Network connectivity may differ from native Windows
- Performance may vary based on WSL configuration

### Q: How do I monitor AIKITA performance?
A: Check:
- Terminal output during `pnpm start`
- Response times in the chat interface
- Ollama model load/usage
- Database query performance (for large libraries)
- Browser developer tools (Network tab)

### Q: Can I customize the appearance/colors?
A: AIKITA uses Tailwind CSS. Basic theming can be adjusted via:
- Tailwind config if available
- CSS overrides (inspect element)
- Not all visual aspects are customizable without code changes

### Q: How do I handle special characters in document text?
A: AIKITA handles Unicode natively. For:
- Non-Latin scripts: Supported if model supports
- Mathematical notation: May not render perfectly
- Code snippets: Preserved in text format
- Tables: Maintained structure in export formats

### Q: Is there a API rate limit?
A: Since AIKITA is local, there's no external API rate limit. Internal limits:
- Request size: 1.5MB max per API call
- Text content: 300K characters per document
- Question length: 4K characters max
- Library size: ~1.8M characters warning

### Q: Can I run multiple AIKITA instances?
A: Yes, but each needs:
- Separate database file (different `data/aikita.db`)
- Different port (modify `vite.config.ts` if needed)
- Separate `.env` configurations
- Not recommended for production without load balancing

### Q: What if I accidentally delete important documents?
A: 
- Check audit logs for deletion events
- Database may have recovery options
- Regular backups of `data/aikita.db` are crucial
- Consider exporting important documents before bulk operations
- Contact support if data appears lost

### Q: Can I use AIKITA for commercial purposes?
A: Yes, AIKITA is free for personal and commercial use. Ensure:
- Ollama license (Ollama is open source MIT)
- Any model licenses (LLM models have their own licenses)
- No violation of document copyrights you upload
- Compliance with your organization's AI usage policies

### Q: How do I provide feedback or report issues?
A: 
- Check existing issues in repository
- Create new issue with detailed description
- Include: OS, Node version, Ollama version, steps to reproduce
- Suggest features for future releases
- Participate in community discussions

### Q: What's the roadmap for AIKITA future features?
A: While specific features may change, common roadmap items include:
- Enhanced OCR accuracy
- More LLM model support
- Collaborative document editing
- Advanced analytics and usage reporting
- Integration with organizational SSO
- Mobile app companion
- Plugin system for extensions
- Multi-tenant support
- Advanced permission systems

### Q: Where can I find additional help?
A:
- This user guide (you are here!)
- Repository README and documentation
- Community forums (if available)
- Direct support for deployment partners
- Contact the maintaining organization for enterprise support

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` (or `Cmd + Enter`) | Send message in chat |
| `Esc` | Focus back to input area |
| `Ctrl + L` | Focus login page inputs |
| `Ctrl + Shift + P` | Open command palette (if available) |
| `F5` | Refresh current page |
| `Ctrl + /` | Toggle keyboard shortcuts help |

## Need More Help?

If you encounter issues not covered in this guide:
1. Check the Troubleshooting section above
2. Review the OLLAMA-GUIDE.md for Ollama-specific issues
3. Check terminal output for error messages
4. Visit the repository issues page
5. Contact your system administrator for deployment-specific problems

Thank you for using AIKITA! May your knowledge work be more efficient and insightful.
