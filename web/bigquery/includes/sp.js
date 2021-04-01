/*
 * Copyright (c) 2021 Snowplow Analytics Ltd. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Apache License Version 2.0 is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Apache License Version 2.0 for the specific language governing permissions and limitations there under.
 */


// model version
const model_version = "bigquery/web/0.1.1";

// model run options
const model_disabled = false;
const assertions_disabled = false;
const destroy_disabled = true;

// schemas
const input_schema = "atomic";
const scratch_schema = "scratch";
const output_schema = "derived";

// entropy
const entropy = "";

// start_date
const start_date = "2021-01-01";

// stage_next
const stage_next = {
    base: true,
    page_views: true,
    sessions:true
};

// skip_derived
const skip_derived = {
    page_views: false,
    sessions: false,
    users: false
};

// DEFAULTS
const lookback_window_hours = 6;
const days_late_allowed = 3;
const session_lookback_days = 365;
const update_cadence_days = 7;
const upsert_lookback_days = 30;
const derived_tstamp_partitioned = false;

const minimumVisitLength = 5;
const heartbeat = 10;
const ua_bot_filter = true;
const iab = false;
const ua_parser = false;
const yauaa = false;

// ends_run
const ends_run = {
    base: false,
    page_views: false,
    sessions: false,
    users: true
};

// cleanup_mode  all / trace / debug
const cleanup_mode = {
    base: "all",
    page_views: "all",
    sessions: "all",
    users: "all"
};

// For custom modules that depend on `staged` tables of the model:
//  - add their (last) dependent steps in the `custom_staged_dependencies` array
//    to ensure they run before the complete steps of the web model
const custom_staged_dependencies = [
    "02_channel_engagement"
];


module.exports = {
    model_disabled,
    destroy_disabled,
    model_version,
    input_schema,
    scratch_schema,
    output_schema,
    entropy,
    start_date,
    stage_next,
    skip_derived,
    lookback_window_hours,
    days_late_allowed,
    session_lookback_days,
    update_cadence_days,
    upsert_lookback_days,
    derived_tstamp_partitioned,
    minimumVisitLength,
    heartbeat,
    ua_bot_filter,
    iab,
    ua_parser,
    yauaa,
    ends_run,
    cleanup_mode,
    assertions_disabled,
    custom_staged_dependencies
};
