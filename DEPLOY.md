# ChinaMigo Deployment

This project is a native HTML/CSS/JavaScript site served by a small Node.js server.

## Recommended: Render

1. Create a GitHub repository and upload this project folder.
2. In Render, create a new **Web Service** from that repository.
3. Use these settings:
   - Runtime: `Node`
   - Build Command: leave empty or use `npm install`
   - Start Command: `npm start`
4. Add environment variables:
   - `ADMIN_USER`: your admin username
   - `ADMIN_PASSWORD`: a strong admin password
   - `ADMIN_EMAIL`: email address that should receive inquiry notifications
   - `OPENAI_API_KEY`: optional, only needed for the admin AI beautify tool
5. Deploy.

Render will provide a public URL like:

```text
https://your-service-name.onrender.com
```

## Railway

1. Upload this project to GitHub.
2. Create a new Railway project from the repository.
3. Railway should detect Node automatically.
4. Use:
   - Start Command: `npm start`
5. Add the same environment variables listed above.

## Local Development

Run:

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:4174
```

## Important Notes

- The app stores content in JSON files inside `data/`.
- On many free hosting platforms, file changes made at runtime may not be permanent after redeploys or restarts.
- For production accounts, inquiries and user data, a real database should be added later.
- Change the default admin credentials before sharing the admin URL.
