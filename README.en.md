<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./public/logo/lockup-vertical-branco.png">
  <img src="./public/logo/lockup-vertical-preto.png" alt="Gume" width="260">
</picture>

**The reading mind never loses its edge.**

An open reading log, built with the people who read it.

[Português](./README.md) · [gume.club](https://gume.club) · [Discussions](https://github.com/olegas4real/gume-club/discussions) · [How to contribute](./CONTRIBUTING.md)

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](./LICENSE)
[![CI](https://github.com/olegas4real/gume-club/actions/workflows/ci.yml/badge.svg)](https://github.com/olegas4real/gume-club/actions/workflows/ci.yml)

Self-hostable · No ads, no affiliate links, no algorithm

</div>

---

<img src="./docs/screenshots/manifesto.png" alt="The logged-out home: a wall of real covers from the catalog, with the thesis over it" width="100%">

A reading app sells itself on its face, so this is the face. Dark background, a serif, and the only color comes from the covers. No leaderboard, no progress bar, nothing trending.

---

## The name

*Gume* is the edge of a blade — the part that cuts.

The reading mind never loses its edge. A blade nobody sharpens doesn't rust overnight: it loses its bite slowly, and it still looks like a blade. You only find out when it fails to cut what it always cut. The mind is the same.

That's why we read. A book is a whetstone, and whoever runs the blade across the stone keeps its edge — not to collect covers, not to hit a target, and least of all to score points.

A reading app that hands you a seven-day streak has misunderstood everything about what is happening when you read. Here there is no streak, there is no yearly goal, and the number never falls when you stop reading.

What there is, instead, is a **ladder**: Iron, Bronze, Silver, and on up, for what you've read across your life. It climbs slowly, it never descends, and it has no leaderboard. It's a group of friends watching their own reading life take shape — not a race.

## Why

I've used almost every reading app. Each one gets something right: one has a beautiful shelf, another the best stats I've ever seen, another a real community around it. I kept hopping between them and never settled.

What I wanted didn't exist: an app where the people who read are also the people who decide what it becomes. A place where you open an issue about the thing that bothers you and watch it get fixed — or fix it yourself. A place where your library isn't a bargaining chip you'd have to leave behind if you ever wanted to walk away.

So: Gume. The interesting part isn't the log. It's the "us".

## What it is

- **A shelf.** Want to read, reading, read, abandoned. Rereads. Physical and digital, in the same place. The rating is a **word** (loved it, liked it, it was ok, didn't like it, didn't finish), never a number: a star is a scale, a scale becomes an average, an average becomes a scoreboard.
- **A friends feed, and a gallery to discover.** The feed is chronological and only from people you follow: what your friends read, with nothing injected in the middle. And there's Explore, a gallery of curators: shelves of people you don't follow yet and collections assembled by hand, shuffled and not ranked. You go into it when you want, instead of it coming into you.
- **Collections, assembled by hand.** You build a collection with a cover, a description and, if the order is the point, a 1st, 2nd and 3rd. Someone else's good collection you **keep**: it shows up on your profile with credit to whoever made it, and whoever made it sees how many people kept it. Keeping is not liking: a like costs a tap, keeping puts someone else's curation inside your own profile, signed with their name. It is the only count of people in the app, and it exists because curation is the thing we most want to happen. And there is one list nobody edits: the **Top 100 favorites**, the books the community loved the most, rebuilt with every verdict. It ranks books, never people: a book on the podium is curation; a person on the podium is the race we refused.
- **An open book graph.** Book data contributed by readers, and the declared intent to publish it back as an open dataset, so that if this project ever ends, the data outlives it. The part where a reader corrects the catalog already works; publishing the dump is a step still to come.
- **Files you can take with you.** One click and the file downloads: JSON and CSV, with your shelf, reading dates, ratings, reviews (including the private ones), and the catalog corrections you made. No queue, no email, no "we're preparing your file", which is friction disguised as care. **And the CSV uses the Goodreads export columns**, the format that Skoob, StoryGraph, Oku and Fable know how to import: *an export is only an exit if another app can read it*. A proprietary JSON nobody imports is a ransom note in a pretty font. Leaving should be easy. That's what makes staying mean something.

<table>
<tr>
<td width="50%"><img src="./docs/screenshots/estante.png" alt="The shelf: the covers, the filters, and the rating as a word" width="100%"></td>
<td width="50%"><img src="./docs/screenshots/explorar.png" alt="Explore: other people's shelves, shuffled and not ranked" width="100%"></td>
</tr>
</table>

## What it won't be

This is not a backlog. These are choices, made on purpose, so that everyone building here is building the same thing:

- **No likes, no follower count, no streak.** Nothing around your READING is counted: not reviews, not who follows you, not who read what. The only count of people in the app is how many kept a collection, and it is about curation, not about you. And no leaderboard: there is an **honor** on your profile, and there is **no list of who read the most**. A list ranked by reading is a machine for making people lie about what they read.
- **The honor never falls, and it doesn't watch the clock.** There is no "books this month", no season, and stopping for a year costs nothing. An app that makes the number drop when life gets hard is an app that punishes the grieving, the sick, the parent of a newborn — and pushes people to open a thin book they don't like just to keep what was already theirs.
- **Abandoning doesn't punish, and the rating doesn't count toward anything.** Reading and hating counts the same as reading and loving; dropping a bad book takes nothing away. If "loved it" were worth more, the app would be buying praise. If abandoning cost something, nobody would ever drop a bad book again.
- **No algorithmic feed.** Recommendations come from people whose taste you chose to follow.
- **No affiliate links.** Today there is no buy link anywhere in the app. If there ever is, it points to an independent bookshop and to your library, never to an Amazon affiliate.
- **No ads, and your reading history is never for sale.**
- **No engagement notifications.** We'll tell you when a friend posts. We will not tell you that your shelf misses you.

If any of these is a dealbreaker for you, that's fine, and there are good apps that make the opposite choice.

<img src="./docs/screenshots/estatisticas.png" alt="Statistics: the span between the oldest and newest book you read, and where your authors come from" width="100%">

The statistics tell you who you are (the age of the works you read, the countries your authors come from), and never how much you read. Comparing taste is the product; comparing effort is the poison.

## How it pays for itself

`gume.club` is hosted and paid for so the app stays free for readers. Anyone who wants to help with the bill can **support it**, and support is optional and **cosmetic**: a badge on the profile, and your name on the supporters list. Support unlocks no features: people who pay and people who don't use exactly the same Gume. This is written here on purpose, because it's a promise.

The license is the guarantee. If the hosted instance ever stops honoring the list above, you can take the code, take your data, and run your own. The exit is the point: it's what makes the promises real instead of merely pretty.

## Running it

Two commands, and they have to work on a clean machine.

```bash
git clone https://github.com/olegas4real/gume-club.git
cd gume-club
```

**macOS, no Docker** (lighter, and what the maintainer uses):

```bash
bash scripts/setup-mac.sh   # homebrew, node, postgres, pnpm, .env, migrations
pnpm dev                    # http://localhost:3000
```

**With Docker**, anywhere:

```bash
cp .env.example .env
docker compose up -d
pnpm install && pnpm db:migrate && pnpm dev
```

Want a sample shelf so you don't start with an empty app? `pnpm db:seed`.

If either one fails on a clean machine, that's a bug and we want the issue. Open source you can't run is decoration.

## How to contribute

This is the part that matters. Gume exists to be built by the people who use it.

**And you can contribute without writing a line of code.** The catalog belongs to everyone: fixing a wrong cover, filling in a missing year, flagging a swapped edition — all of it is a contribution, applied on the spot, with your name in the history. On the page of who makes Gume, the people who tend the catalog and the people who write the code appear side by side, with equal weight, because **a cover fix is worth what a commit is worth.**

<table>
<tr>
<td width="50%"><img src="./docs/screenshots/contribuidores.png" alt="Who makes Gume: catalog stewards and code writers, on the same page, with the same weight" width="100%"></td>
<td width="50%"><img src="./docs/screenshots/o-que-falta.png" alt="What's missing: the open catalog work, starting with the books on your own shelf" width="100%"></td>
</tr>
</table>

For those who will write code, especially welcome:

- **Importers.** StoryGraph, Skoob, LibraryThing, Kindle, Kobo. The Goodreads one already exists and opened the spine; these reuse it. The bar is **lossless**: reading dates, ratings, review text, shelves, all of it. Half-finished migrations are why most people never leave a platform they've outgrown. Each importer is a self-contained first PR.
- **Book data.** Matching, deduplication, covers, non-English catalogs.
- **Polished PT-BR.** The priority is the app flawless in Brazilian Portuguese. Translating to other languages comes much later, once BR is solid. It's not the time.
- **Design.** The bar is in [docs/design.md](./docs/design.md). If you can beat it, please do.

Issues tagged `good first issue` are real: each one says what it is, why it matters, which file to touch, and how to test. The larger ones already have their full text ready in [`.github/ISSUE_DRAFTS/`](./.github/ISSUE_DRAFTS). Read [CONTRIBUTING.md](./CONTRIBUTING.md) and the [Code of Conduct](./CODE_OF_CONDUCT.md) first. And **you can ask before you start**, in the [Discussions](https://github.com/olegas4real/gume-club/discussions).

## The catalog is common, and it's the hard part

Everything else in a reading log is simple. Book metadata is where these projects live or die.

<img src="./docs/screenshots/livro.png" alt="The book page: cover, synopsis with its source, the edition, and the author with a face" width="100%">

The model:

- A **work** is the book as an idea. *Dom Casmurro*.
- An **edition** is an object. The hardcover from Clube de Literatura Clássica, with that cover, the ISBN, the page count.
- You rate the **work**. You read an **edition**, because the page count changes.
- Every correction is an **append-only revision** with an author. Nothing is overwritten silently, anything can be reverted, and trust is earned over time. The cover is the one exception: because it's the only field that shows up on everyone's screen, there the reader proposes and a librarian checks.

**A different cover is a different EDITION.** Overwriting the shared record so it matches your copy is forbidden, and that's exactly how the Goodreads catalog turned to junk. If you have opinions about this, we want to hear them.

## Status

**It works.** The product is up and used every day by the person who maintains it: shelf, search over a Portuguese catalog of hundreds of thousands of editions, chronological feed, person-to-person recommendation (with the recommender's face on the cover), collections with order and cover, the community's Top 100, curation statistics, catalog corrections, invitations with provenance, and lossless import and export.

**It's live at [gume.club](https://gume.club).** The official instance runs on [Railway](https://railway.app) (the Next.js app and Postgres, on the same private network), with [Vercel Blob](https://vercel.com/storage/blob) for reader-uploaded images. None of that is required: being self-hostable, you can run your own with a Postgres and any place to keep the images.

The schema, the plan, and the design system are public on purpose, because they're the decisions that are expensive to change later and cheap to argue about now. If you think one of them is wrong, open an issue. That's not a formality.

**What holds quality, given that the maintainer is not a trained programmer:** the repository defends itself. More than 800 tests, and the most important ones don't test functions: they **sweep the code itself** and break the build if a rule is violated. One test stops a contribution count from leaking off the contributors page. Another stops a badge from being earned by reading. Another stops a route from being born public without anyone deciding. And a "red team" attacks the system itself, swapping UUIDs to try to read and write another person's rows.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Web | Next.js (App Router) + TypeScript | The web is the primary platform, and the largest pool of contributors. |
| Styling | Tailwind + custom tokens | See [docs/design.md](./docs/design.md). |
| Database | Postgres + Drizzle | Plain Postgres, no vendor-specific features, so self-hosting is real. |
| Auth | Better Auth | Self-hostable, no third-party dependency. |
| Book data | [Open Library](https://openlibrary.org/developers/api) primary, Google Books as fallback | Open license, no key. We keep our own `works`/`editions` tables so readers can fix bad data. |
| Mobile | PWA first, native later | Installable from day one. |
| Built with | [Claude Code](https://claude.com/claude-code), by Anthropic | The code is written in pairing with AI, and the repository doesn't hide it. The bar is human: what holds quality is the tests that sweep the code itself, and a person decides what goes in. |

## Where things are

| Folder | What it is |
|---|---|
| `app/` | The screens (Next.js App Router) and the server actions |
| `components/` | The interface pieces |
| `lib/` | All the server logic. **`lib/authz.ts` is authorization, and it lives only there.** |
| `lib/db/` | The schema (Drizzle) and the migrations |
| `scripts/` | Catalog import, seeds, security audit |
| `docs/` | [Schema](./docs/schema.md), [design system](./docs/design.md), the [proposed naming rule](./docs/NOMES.md), screenshots |
| `ai/` | [Plan](./ai/PLAN.md), [PRD](./ai/PRD.md), and the [decision log](./ai/DECISIONS.md) |

**Read first:** [AGENTS.md](./AGENTS.md) is this repository's contract: the rules, what you don't vibe-code, and how code gets into `main`. [ai/DECISIONS.md](./ai/DECISIONS.md) is the memory: it starts with the ten rules that hold today, and every hard decision is there with the **why**, and isn't relitigated without a new argument.

## License

[AGPL-3.0](./LICENSE). Run it, change it, host it for other people. If you host a modified version, share the changes. Nobody can close this and sell your reading history back to you.
