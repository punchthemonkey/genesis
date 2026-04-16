
```markdown
# Frequently Asked Questions

### Q: Why does Genesis require a master password?

A: Your API keys and synced data are encrypted with a key derived from your master password. This ensures that even if someone gains access to your device or the sync server, they cannot read your secrets. **Genesis never stores your password**—only a salted hash and encrypted vault.

### Q: Can I recover my master password if I forget it?

A: No. By design, there is no recovery mechanism. This is a security trade‑off: we prioritize absolute privacy. If you forget your password, you will lose access to your encrypted API keys and synced data. You can still use the app by resetting (which wipes the vault).

### Q: Does Genesis work on Android?

A: WebGPU support on Android is limited. Genesis is optimized for iOS Safari 26+ (iPhone 15 Pro or later) and desktop Chrome with WebGPU flags. Android support will improve as WebGPU rolls out.

### Q: How much storage does the model use?

A: The default model (SmolLM2‑135M) is about 500 MB. It is cached in the browser's Cache Storage. Additional conversations and embeddings use IndexedDB (typically <50 MB).

### Q: Is cloud sync required?

A: No. Sync is optional and off by default. You can use Genesis completely offline, and all data stays on your device.

### Q: Can I use my own OpenAI API key?

A: Yes. In Settings → API Keys, you can add your own key for cloud delegation. It is encrypted in the vault and never sent to Genesis servers.

### Q: How do I create a skill?

A: Write a JSON manifest following the schema in [API.md](./API.md). Then install it via the skill installer UI. You can also publish skills to the community registry.

### Q: What happens if the self‑evolution feature proposes a bad change?

A: All self‑evolution proposals are reviewed by a human (you) before being applied. For code changes, a GitHub PR is opened and must pass CI checks and human review.

### Q: Why Preact instead of React?

A: Preact is significantly smaller (<4KB) while offering a nearly identical API. This reduces bundle size and improves load times, which is critical for a PWA.

### Q: How do I report a security vulnerability?

A: Please email security@genesis.example (placeholder). Do not open a public issue. We follow responsible disclosure.
