[21:54:47.629] Running build in Washington, D.C., USA (East) – iad1
[21:54:47.630] Build machine configuration: 2 cores, 8 GB
[21:54:47.667] Cloning github.com/Cachi0001/Biz (Branch: main, Commit: 248e3ac)
[21:54:47.801] Previous build caches not available
[21:54:48.012] Cloning completed: 344.000ms
[21:54:48.374] Running "vercel build"
[21:54:48.852] Vercel CLI 44.2.10
[21:54:49.025] WARN! Due to `builds` existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply. Learn More: https://vercel.link/unused-build-settings
[21:54:49.451] Installing dependencies...
[21:55:35.425] npm warn deprecated abab@2.0.6: Use your platform's native atob() and btoa() methods instead
[21:55:35.444] npm warn deprecated domexception@4.0.0: Use your platform's native DOMException instead
[21:55:35.813] npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
[21:55:36.061] npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
[21:55:42.216] 
[21:55:42.217] added 802 packages in 52s
[21:55:42.218] 
[21:55:42.218] 171 packages are looking for funding
[21:55:42.218]   run `npm fund` for details
[21:55:42.285] Running "npm run build"
[21:55:42.395] 
[21:55:42.395] > bizflow-frontend@0.0.0 build
[21:55:42.396] > tsc && vite build
[21:55:42.396] 
[21:55:44.075] error TS6305: Output file '/vercel/path0/frontend/bizflow-frontend/vite.config.d.ts' has not been built from source file '/vercel/path0/frontend/bizflow-frontend/vite.config.ts'.
[21:55:44.076]   The file is in the program because:
[21:55:44.076]     Matched by include pattern 'vite.config.ts' in '/vercel/path0/frontend/bizflow-frontend/tsconfig.json'
[21:55:44.095] Error: Command "npm run build" exited with 2
[21:55:44.347] 
[21:55:47.240] Exiting build container