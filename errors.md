[21:57:55.075] Running build in Washington, D.C., USA (East) – iad1
[21:57:55.079] Build machine configuration: 2 cores, 8 GB
[21:57:55.110] Cloning github.com/Cachi0001/Biz (Branch: main, Commit: f6fa7be)
[21:57:55.555] Previous build caches not available
[21:57:55.850] Cloning completed: 739.000ms
[21:57:56.688] Running "vercel build"
[21:57:57.158] Vercel CLI 44.2.10
[21:57:57.338] WARN! Due to `builds` existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply. Learn More: https://vercel.link/unused-build-settings
[21:57:57.883] Installing dependencies...
[21:58:44.811] npm warn deprecated abab@2.0.6: Use your platform's native atob() and btoa() methods instead
[21:58:44.946] npm warn deprecated domexception@4.0.0: Use your platform's native DOMException instead
[21:58:45.368] npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
[21:58:45.515] npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
[21:58:51.586] 
[21:58:51.586] added 802 packages in 53s
[21:58:51.586] 
[21:58:51.586] 171 packages are looking for funding
[21:58:51.587]   run `npm fund` for details
[21:58:51.658] Running "npm run build"
[21:58:51.768] 
[21:58:51.768] > bizflow-frontend@0.0.0 build
[21:58:51.768] > tsc && vite build
[21:58:51.769] 
[21:58:53.771] src/components/__tests__/Button.test.tsx(2,24): error TS7016: Could not find a declaration file for module '@/components/ui/button'. '/vercel/path0/frontend/bizflow-frontend/src/components/ui/button.jsx' implicitly has an 'any' type.
[21:58:53.771] src/setupTests.ts(8,1): error TS2322: Type 'typeof IntersectionObserver' is not assignable to type '{ new (callback: IntersectionObserverCallback, options?: IntersectionObserverInit | undefined): IntersectionObserver; prototype: IntersectionObserver; }'.
[21:58:53.771]   Types of property 'prototype' are incompatible.
[21:58:53.772]     Type 'IntersectionObserver' is missing the following properties from type 'IntersectionObserver': root, rootMargin, thresholds, takeRecords
[21:58:53.772] src/setupTests.ts(45,1): error TS2739: Type '{ getItem: Mock<any, any, any>; setItem: Mock<any, any, any>; removeItem: Mock<any, any, any>; clear: Mock<any, any, any>; }' is missing the following properties from type 'Storage': length, key
[21:58:53.772] src/setupTests.ts(54,1): error TS2739: Type '{ getItem: Mock<any, any, any>; setItem: Mock<any, any, any>; removeItem: Mock<any, any, any>; clear: Mock<any, any, any>; }' is missing the following properties from type 'Storage': length, key
[21:58:53.792] Error: Command "npm run build" exited with 2
[21:58:54.181] 
[21:58:57.646] Exiting build container