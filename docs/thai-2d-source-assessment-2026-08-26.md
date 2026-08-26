# Thai 2D Source Assessment

**Assessment date:** 2026-08-26
**User-provided documentation:** <https://docs.thaistock2d.com/>
**Current-data endpoints checked:** <https://api.thaistock2d.com/live> and <https://api.thaistock2d.com/2d_result>

## Source behavior

The documentation describes a Thai Stock 2D API with a current-day live endpoint and a recent-result endpoint. The current-day response exposes four scheduled result fields: `open_time`, `twod`, `set`, `value`, and date/time metadata. The recent-result endpoint returned the same four values for 2026-08-26.

This is a third-party data source supplied by the user. It should be shown in SKY1688 with the explicit source label **Thai Stock 2D API** and its URL. The API payload does not declare a timezone, so a production automation policy must define and document the timezone before raw API timestamps are transformed into stored UTC timestamps.

## Current 2026-08-26 snapshot

| API open time | 2D number | SET | Value | API result identifier |
|---|---:|---:|---:|---:|
| 11:00:00 | 11 | 1,607.61 | 32,871.48 | 2765893 |
| 12:01:00 | 78 | 1,608.37 | 40,068.01 | 2766328 |
| 15:00:00 | 25 | 1,607.72 | 55,555.14 | 2767283 |
| 16:30:00 | 29 | 1,601.92 | 71,659.69 | 2767737 |

## Proposed SKY1688 publication mapping

Each source row can be represented as a separate published `2d` result. The result number should preserve a leading zero when present, the title should include the draw date and source time, and the note should retain the SET/value metadata and API identifier. No record has been created, drafted, or published in SKY1688 as part of this assessment.

| SKY1688 field | Proposed mapping |
|---|---|
| Type | `2d` |
| Result number | API `twod` |
| Title | `Thai Stock 2D — YYYY-MM-DD HH:mm` |
| Draw time | API date + `open_time`, after a timezone policy is approved |
| Source label | `Thai Stock 2D API` |
| Note | `SET: … · Value: … · API result ID: …` |
| Status | Draft until the administrator explicitly confirms public publication |

## Publication decision required

Before any public write, the administrator must choose whether to publish **all four daily 2D draws** or only the latest 16:30 draw, and confirm which timezone SKY1688 should use for this source. A public write has not been performed.

## Administrator-approved publication selection

The administrator selected only the 12:01 result `78` and the 16:30 result `29` for 2026-08-26, confirmed Thailand time (UTC+7), and approved public publication. Because the Administrator browser operates in Myanmar time (UTC+6:30), the corresponding local form inputs are 11:31 and 16:00 respectively; their stored UTC instants are 05:01Z and 09:30Z. The first form was populated with source attribution and API metadata before submission.

The 12:01 result `78` was created successfully with `published` status and appeared in the protected result-management list. The 16:30 result remains to be created and validated.

The 16:30 result `29` form was prepared with the selected source label, Thailand-time metadata, API identifier, and `published` status. No additional draw was selected.

The 16:30 result `29` was created successfully with `published` status. The public `/results` board displayed both published records, `29` and `78`, with their titles, source metadata, and result numbers. The 2D filter was then selected for category-specific validation.

The public 2D filter completed successfully and displayed both published Thai Stock 2D records. The detail route for the 16:30 result (`/results/30001`) was opened for end-to-end rendering validation.

The public detail page for result `29` rendered successfully, showing its `2D` and published status, draw-date title, result number, and source metadata. This completes the positive end-to-end public detail-route check using an administrator-approved published record.

## Validation evidence

The protected Admin list showed both records as published. The public all-results board and 2D filter each displayed both records, and the `29` detail page rendered successfully at `/results/30001`. The final automated validation run completed with 16 passing tests, a successful TypeScript check, and a successful production build.
