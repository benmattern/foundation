# Data Workspace dependency notices

The application uses the unmodified packages below. Version resolutions and
additional transitive licenses are recorded in package-lock.json. Preserve these
notices and bundled license headers when distributing the application.

| Package | Version | License / upstream |
|---|---|---|
| @duckdb/duckdb-wasm | 1.32.0 | MIT, https://github.com/duckdb/duckdb-wasm |
| @perspective-dev/client, server, viewer, viewer-datagrid, viewer-charts | 5.6.0 | Apache-2.0, Copyright (c) 2017, the Perspective Authors; https://github.com/perspective-dev/perspective |
| papaparse | 5.7.0 | MIT, Copyright (c) 2015 Matthew Holt; https://github.com/mholt/PapaParse |
| apache-arrow (DuckDB dependency) | lockfile | Apache-2.0, Apache Software Foundation; https://github.com/apache/arrow |
| pro_self_extracting_wasm (Perspective bootstrap) | 0.0.9 | Apache-2.0, Copyright (C) 2025, The Prospective Company |
| @types/papaparse (development) | 5.5.2 | MIT, DefinitelyTyped contributors |
| fake-indexeddb (tests) | 6.2.6 | Apache-2.0 |

Full license texts are shipped in `public/licenses/`. DuckDB's npm package
omits a root LICENSE; its upstream license is retained there. Perspective sources
retain their copyright/license headers. No Perspective or DuckDB fork is made.
