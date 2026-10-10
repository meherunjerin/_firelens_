<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep FireLens presentation in the shared fl components and global semantic tokens; this keeps the home and region-detail experiences consistent without changing demo data.
- Use generated Earth observation assets as illustrative imagery, not as evidence data; this preserves the distinction between visual storytelling and deterministic demo observations.
- Keep ambient motion viewport-paused and reduced-motion-aware; dynamically load the disposable Three.js Earth scene on the client so SSR stays browser-safe and offscreen rendering stops.
