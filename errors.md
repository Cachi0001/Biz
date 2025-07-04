[22:01:19.334] Running build in Washington, D.C., USA (East) – iad1
[22:01:19.335] Build machine configuration: 2 cores, 8 GB
[22:01:19.357] Cloning github.com/Cachi0001/Biz (Branch: main, Commit: cbd70cb)
[22:01:19.486] Previous build caches not available
[22:01:19.669] Cloning completed: 312.000ms
[22:01:20.014] Running "vercel build"
[22:01:20.926] Vercel CLI 44.2.10
[22:01:21.107] WARN! Due to `builds` existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply. Learn More: https://vercel.link/unused-build-settings
[22:01:21.526] Installing dependencies...
[22:02:09.902] npm warn deprecated abab@2.0.6: Use your platform's native atob() and btoa() methods instead
[22:02:09.954] npm warn deprecated domexception@4.0.0: Use your platform's native DOMException instead
[22:02:10.369] npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
[22:02:10.555] npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
[22:02:17.102] 
[22:02:17.102] added 802 packages in 55s
[22:02:17.102] 
[22:02:17.102] 171 packages are looking for funding
[22:02:17.102]   run `npm fund` for details
[22:02:17.157] Running "npm run build"
[22:02:17.846] 
[22:02:17.847] > bizflow-frontend@0.0.0 build
[22:02:17.847] > tsc && vite build
[22:02:17.847] 
[22:02:19.966] src/components/__tests__/Button.test.tsx(19,20): error TS2322: Type '{ children: string; variant: string; }' is not assignable to type 'IntrinsicAttributes & ButtonProps & RefAttributes<HTMLButtonElement>'.
[22:02:19.966]   Property 'variant' does not exist on type 'IntrinsicAttributes & ButtonProps & RefAttributes<HTMLButtonElement>'.
[22:02:19.967] src/components/__tests__/Button.test.tsx(25,20): error TS2322: Type '{ children: string; size: string; }' is not assignable to type 'IntrinsicAttributes & ButtonProps & RefAttributes<HTMLButtonElement>'.
[22:02:19.967]   Property 'size' does not exist on type 'IntrinsicAttributes & ButtonProps & RefAttributes<HTMLButtonElement>'.
[22:02:20.040] Error: Command "npm run build" exited with 2
[22:02:20.316] 
[22:02:23.368] Exiting build container