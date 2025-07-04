[21:33:34.494] Running build in Washington, D.C., USA (East) – iad1
[21:33:34.495] Build machine configuration: 2 cores, 8 GB
[21:33:34.510] Cloning github.com/Cachi0001/Biz (Branch: main, Commit: 29c4a7d)
[21:33:34.716] Previous build caches not available
[21:33:34.896] Cloning completed: 385.000ms
[21:33:35.279] Running "vercel build"
[21:33:35.735] Vercel CLI 44.2.10
[21:33:35.910] WARN! Due to `builds` existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply. Learn More: https://vercel.link/unused-build-settings
[21:33:36.336] Installing dependencies...
[21:34:22.319] npm warn deprecated abab@2.0.6: Use your platform's native atob() and btoa() methods instead
[21:34:22.376] npm warn deprecated domexception@4.0.0: Use your platform's native DOMException instead
[21:34:22.729] npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
[21:34:22.900] npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
[21:34:29.787] 
[21:34:29.788] added 802 packages in 53s
[21:34:29.789] 
[21:34:29.789] 171 packages are looking for funding
[21:34:29.789]   run `npm fund` for details
[21:34:29.864] Running "npm run build"
[21:34:30.016] 
[21:34:30.017] > bizflow-frontend@0.0.0 build
[21:34:30.017] > tsc && vite build
[21:34:30.017] 
[21:34:31.743] error TS6305: Output file '/vercel/path0/frontend/bizflow-frontend/vite.config.d.ts' has not been built from source file '/vercel/path0/frontend/bizflow-frontend/vite.config.ts'.
[21:34:31.743]   The file is in the program because:
[21:34:31.744]     Matched by include pattern 'vite.config.ts' in '/vercel/path0/frontend/bizflow-frontend/tsconfig.json'
[21:34:31.744] tsconfig.json(56,5): error TS6310: Referenced project '/vercel/path0/frontend/bizflow-frontend/tsconfig.node.json' may not disable emit.
[21:34:31.764] Error: Command "npm run build" exited with 2
[21:34:32.010] 
[21:34:34.833] Exiting build container