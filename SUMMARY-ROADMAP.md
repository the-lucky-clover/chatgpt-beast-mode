# Summarization follow-up plan

## 1. Verify live summarization

The unpacked extension now passes article extraction, request dispatch, and streamed
summary rendering with a controlled provider response. Verify a real article and
a video with available captions using the user's configured provider before
building history or batch mode. Show explicit errors for missing captions,
authentication failures, quota limits, and unsupported pages.

## 2. Clearable local history

- Store completed summaries locally in IndexedDB: title, source URL, timestamp,
  provider/model, prompt name, and summary text. Do not store credentials or raw
  page bodies. Exclude private/incognito sessions by default.
- Add a History view with search, reopen-source, copy, delete-one, and Clear All.
  Confirm Clear All and provide an optional history-off setting.
- Start with a limit of 100 summaries; make retention visible and remove the
  oldest entries when full. Failed/cancelled requests should not become summaries.
- Verify persistence after restart, deletion, storage limits, and sensitive URL
  handling. History is independent of the temporary response cache.

## 3. Batch summaries for the current window

Recommended first version: a reviewable queue of selected background tabs, processed
one at a time. Preserve the active tab and never navigate or activate source tabs.

1. Snapshot tabs in the current window and show selectable titles, URLs, and
   unsupported-page reasons. Default to eligible background tabs. Let the user
   review the list and start explicitly, since each tab may incur provider usage.
2. Extract content by the captured tab ID. The current single-page code queries
   the active tab; batch mode must not reuse that assumption. Detect closed,
   discarded, or navigated tabs and mark them skipped or needing retry.
3. For videos, use available captions/transcripts. Report missing captions without
   pretending the page title or description represents the video. Audio
   transcription would be a separate opt-in feature and cost.
4. Keep a persistent job record with queued/running/completed/failed/skipped states,
   attempts, source identity, and result IDs. The MV3 service worker can suspend;
   on restart, reconcile unfinished work and offer resume without duplicating
   completed summaries or silently issuing duplicate paid requests.
5. Start with concurrency one. Add cancel/pause, bounded retries for transient
   failures, rate-limit backoff, and per-tab errors. Use real progress such as
   “3 of 8 tabs completed”; use an indeterminate bar within each request.
6. Save successful results in local history and show a batch results list with
   copy/export options. Failure on one tab must not discard other results.

Acceptance checks: active tab unchanged, only selected tabs processed, navigation
races detected, unavailable captions skipped, retry/cancel behavior, worker restart,
rate limits, and Clear All removing stored history and associated result references.

History and batch mode are planned here, not implemented in this change.
