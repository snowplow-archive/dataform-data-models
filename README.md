# Snowplow dataform-data-models

[![early-release]][tracker-classificiation]
[![License][license-image]][license]
[![Discourse posts][discourse-image]][discourse]

## Quickstart

 - The `web/bigquery` directory contains the Snowplow BigQuery web model v1.0.3 structured as a Dataform project. As a first step copy its contents to the root of your Dataform project.
 - Configure the model.
 - Setup your environment(s) in `environment.json` and set a schedule or start a new run!


## Prerequisites

The [Snowplow data models][data-models] are relevant to users who already have a full [Snowplow][snowplow] pipeline running and a dataset of web events from [Snowplow Trackers][trackers] loaded in their database. At the moment the Snowplow web data model in Dataform only supports BigQuery.


## Overview

This repository contains the first version of adapting the [new generation][blog-new-generation] of [Snowplow's BiqQuery web data model v1][bq-web-model-dir] to be run with [Dataform][dataform]. As such and in order to keep an exact correspondence, in v0.1.0 we intentionally and explicitly enforced the incrementalization logic and modular structure of the parent model.

That way the Snowplow Dataform's web data model inherits as key features:

 - Extensible modular structure
 - Metadata log tables
 - Assertions to test your data quality
 - Feature flags

You can read more about the structure, logic and technical architecture of the Snowplow web data model:
 - in the [README][readme-web-v1] of the official data-models repository
 - in the Snowplow [blog][blog-bigquery]
 - in our [docs][docs-datamodeling]

As an overview the standard web data model runs 4 core modules:

```
.
├── dataform.json
├── definitions
│   ├── assertions
│   ├── standard
│   │   ├── 00_setup
│   │   ├── 01_base
│   │   ├── 02_page_views
│   │   ├── 03_sessions
│   │   └── 04_users
│   └── utils
│       └── declarations.js
├── environments.json
├── includes
│   └── sp.js
├── package.json
└── package-lock.json

```

1. **01_base**
   The Base module applies incremental logic to the atomic data, and produces deduplicated tables for the Page Views module.

2. **02_page_views**
   The page views module runs the standard web page views model. It takes the `events_staged` table - produced by the Base module - as an input (and also queries atomic data). Its persistent output is the `derived.page_views` table.

3. **03_sessions**
   The sessions module runs the standard web sessions model - it takes the `page_views_staged` table - produced by the Page Views module - as an input. Its persistent output is the `derived.sessions` table.

4. **04_users**
   The users module runs the standard web users model - it takes the `sessions_userid_manifest_staged` table - produced by the Sessions module - as an input. Its persistent output is the `derived.users` table.


## Configuration

To configure your data model you only need to check the `sp.js` file in your `includes` directory:

### Parameters

1. **Schema names**
   - `input_schema`: name of atomic dataset
   - `scratch_schema`: name of scratch dataset
   - `output_schema`: name of derived dataset

   ```
   const input_schema = "rt_pipeline_prod1";
   const scratch_schema = "scratch";
   const output_schema = "derived";
   ```

2. **Dataform specific**
   - `model_disabled`: (Default: `false`). Provides a way to disable the model. It affects the 01-main and the 99-complete steps.
   - `assertions_disabled`: (Default: `false`). Whether assertions are run along the model.
   - `destroy_disabled`: (Default: `true`). Provides a way to drop all tables produced by the model for a full rerun. _Note_: this does not affect the `datamodel_metadata` table.

   ```
   const model_disabled = false;
   const assertions_disabled = false;
   const destroy_disabled = false;
   ```

3. **Entropy**
   - `entropy`: You can specify a string to append to all tables (default: `""`), to test without affecting prod tables. _Note_: the model does not make use and is not affected by Dataform's `tablePrefix`.

   ```
   const entropy = "_test";
   ```

4. **Start date**
   - `start_date`: the start date, used to seed manifest.

5. **Output**
   - `stage_next`: specifies whether each module will update staging tables
   - `skip_derived`: specifies whether each module will skip inserting to production tables

   ```
   const stage_next = {
       base: true,
       page_views: true,
       sessions:true
   };
   const skip_derived = {
       page_views: false,
       sessions: false,
       users: false
   };
   ```

6. **Cleanup**
   - `ends_run`: set to true for no subsequent modules in the run
   - `cleanup_mode`: One of: `debug` - only keeps main tables, `trace` - keeps all tables, `all` - cleans up everything.

   ```
   const ends_run = {
       base: false,
       page_views: false,
       sessions: false,
       users: true
   };
   const cleanup_mode = {
       base: "all",
       page_views: "all",
       sessions: "all",
       users: "all"
   };
   ```

7. **Other parameters**
   - `lookback_window_hours`: (default: 6). Period of time (in hours) to look before the latest event in manifest - to account for late arriving data, which comes out of order.
   - `days_late_allowed`: (default: 3). Period of time (in days) for which we should include late data. If the difference between collector tstamps for the session start and new event is greater than this value, data for that session will not be processed.
   - `session_lookback_days`: (default: 365). Period of time (in days) to limit scan on session manifest. Exists to improve performance of model when we have a lot of sessions. Should be set to as large a number as practical.
   - `update_cadence_days`: (default: 7). Period of time (in days) in the future (from the latest event in manifest) to look for new events.
   - `upsert_lookback_days`: (default: 30). Period of time (in days) to look back over the target table in order to find rows to delete when committing data to a table.
   - `derived_tstamp_partitioned`: (default: `false`). For use on legacy pipelines whose partition key is the `derived_tstamp`. Note that this affects the incremental logic somewhat, as `derived_tstamp` isn't closely tied to when data was received and so it is recommended to extend the `lookback_window_hours` if the events table is partitioned by `derived_tstamp`.
   - `minimumVisitLength`: (default: 5). The value of `minimumVisitLength` configured in the [Snowplow Javascript tracker][javascript-tracker]
   - `heartbeat`: (default: 10). The value of `heartbeat` configured in the Javascript tracker.
   - `ua_bot_filter`: (default: `true`). Whether to filter out bots via useragent string pattern match.
   - `iab`: (default: `false`). Whether to include data from the IAB [enrichment][enrichments].
   - `ua_parser`: (default: `false`). Whether to include data from the UA Parser enrichment.
   - `yauaa`: (default: `false`). Whether to include data from the YAUAA enrichment.

8. **Custom staged dependencies**
   - `custom_staged_dependencies` : This array parameter allows you ensure custom steps that depend on standard model's `staged` tables run before the complete steps that truncate them. You can read more in [Customization][customization] below.

Now your model is configured and you can finish by setting up your Dataform environment(s).


## Customization

Following the [customization plugin principles][custom-sql] of the parent [v1 Bigquery web model][bq-web-model-dir], it is also possible to customize the Dataform model and leverage the incrementalization logic of the standatd modules.

In the `definitions/custom` subdirectory you can find the [same custom example][custom-sql] featured in the v1 BigQuery web model implemented for Dataform. In the directory structure you can see the custom modules parallel to standard:

```
├── dataform.json
├── definitions
│   ├── assertions
│   ├── custom
│   ├── standard
│   └── utils
├── environments.json
├── includes
│   └── sp.js
├── package.json
└── package-lock.json
```

In order to compliment the standard model with your custom incremental module, you only need to know which module's `_staged` tables it is meant to consume. Those modules' commit actions will be the dependencies of your custom module.

For example, the featured custom module, consumes both the `events_staged` and the `page_views_staged` tables, that are outputs of the `01_base` and `02_page_views` modules respectively. Since the `02_page_views` module already depends on the `01_base` module, it suffices to depend the first action of the custom module only on the last step of the page_views module (`07_commit_page_views`).

```
config {
  type: "operations",
  name: "01_link_clicks",
  disabled: sp.model_disabled,
  dependencies: [
    "07_commit_page_views"
  ],
  hermetic: true,
  hasOutput: false,
  tags: ["sp_web", "sp_custom"]
}

```

Since the `99_complete` steps of the standard model complete the incremental logic by truncating the `staged` tables, you also need to ensure that the part of custom module that depends on those tables, also runs before the `99_complete` steps. In order to do so, you only need to add the dependent step(s) in the `custom_staged_dependencies` array defined in the `sp.js` file.

```
const custom_staged_dependencies = [
    "02_channel_engagement"
];

```

As you can see, for our custom example, the last step depending on `staged` tables is the `02_channel_engagement`, which gets added in `custom_staged_dependencies`.

Further notes:
1. The custom module follows the incrementalization logic of standard modules, by having the main, complete and detroy steps of its own:

   - The main steps of the custom module run along the standard model, that's why in their config we set:

   ```
     disabled: sp.model_disabled,
   ```

   - The `complete` step of the custom module, need to _also_ run for a complete destruction of the whole model, that is why in `custom/99_custom_complete.sqlx`:

   ```
     disabled: sp.model_disabled && sp.destroy_disabled,
   ```

   - Similarly the destroy step of the custom module runs along the destroy steps of the standard model:

   ```
     disabled: sp.destroy_disabled,
   ```


2. We generally suggest that any customization:

   - Follows in analogy the same [guidelines and best practices][custom-best-practices] mentioned in Snowplow's v1 web model.
   - Interacts with the standard model only through the `sp.js` file, avoiding to change the standard model's files directly.


# Join the Snowplow community

We welcome all ideas, questions and contributions!

For support requests, please use our community support [Discourse][discourse] forum.

If you find a bug, please report an issue on GitHub.


# Copyright and license

The Snowplow Incubator dataform-data-models project is Copyright 2021 Snowplow Analytics Ltd.

Licensed under the [Apache License, Version 2.0][license] (the "License");
you may not use this software except in compliance with the License.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.


[license-image]: http://img.shields.io/badge/license-Apache--2-blue.svg?style=flat
[license]: http://www.apache.org/licenses/LICENSE-2.0

[discourse-image]: https://img.shields.io/discourse/posts?server=https%3A%2F%2Fdiscourse.snowplowanalytics.com%2F
[discourse]: http://discourse.snowplowanalytics.com/

[tracker-classificiation]: https://docs.snowplowanalytics.com/docs/collecting-data/collecting-from-own-applications/tracker-maintenance-classification/
[early-release]: https://img.shields.io/static/v1?style=flat&label=Snowplow&message=Early%20Release&color=014477&labelColor=9ba0aa&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAeFBMVEVMaXGXANeYANeXANZbAJmXANeUANSQAM+XANeMAMpaAJhZAJeZANiXANaXANaOAM2WANVnAKWXANZ9ALtmAKVaAJmXANZaAJlXAJZdAJxaAJlZAJdbAJlbAJmQAM+UANKZANhhAJ+EAL+BAL9oAKZnAKVjAKF1ALNBd8J1AAAAKHRSTlMAa1hWXyteBTQJIEwRgUh2JjJon21wcBgNfmc+JlOBQjwezWF2l5dXzkW3/wAAAHpJREFUeNokhQOCA1EAxTL85hi7dXv/E5YPCYBq5DeN4pcqV1XbtW/xTVMIMAZE0cBHEaZhBmIQwCFofeprPUHqjmD/+7peztd62dWQRkvrQayXkn01f/gWp2CrxfjY7rcZ5V7DEMDQgmEozFpZqLUYDsNwOqbnMLwPAJEwCopZxKttAAAAAElFTkSuQmCC

[snowplow]: https://snowplowanalytics.com
[data-models]: https://github.com/snowplow/data-models
[bq-web-model-dir]: https://github.com/snowplow/data-models/tree/master/web/v1/bigquery
[dataform]: https://dataform.co/
[trackers]: https://docs.snowplowanalytics.com
[readme-web-v1]: https://github.com/snowplow/data-models/blob/master/web/v1/README.md
[blog-new-generation]: https://snowplowanalytics.com/blog/2020/11/13/introducing-a-new-generation-of-our-web-data-model/
[blog-bigquery]: https://snowplowanalytics.com/blog/2021/03/22/introducing-our-bigquery-and-snowflake-web-data-models/
[docs-datamodeling]: https://docs.snowplowanalytics.com/docs/modeling-your-data/the-snowplow-web-data-model/
[javascript-tracker]: https://docs.snowplowanalytics.com/docs/collecting-data/collecting-from-own-applications/javascript-trackers/javascript-tracker/
[enrichments]: https://docs.snowplowanalytics.com/docs/enriching-your-data/available-enrichments/
[customization]: https://github.com/snowplow-incubator/dataform-data-models/tree/master#customization
[custom-sql]: https://github.com/snowplow/data-models/tree/master/web/v1/bigquery/sql-runner/sql/custom
[custom-best-practices]: https://github.com/snowplow/data-models/tree/master/web/v1/bigquery/sql-runner/sql/custom#guidelines--best-practice
