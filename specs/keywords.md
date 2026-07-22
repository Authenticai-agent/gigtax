# Keyword and page proposals

Proposals that need owner approval before building. Nothing here is built.

---

## S5 — formation comparison-pair pages

**Status: PROPOSED, awaiting approval. Not built.**

The spec sketches `/delaware-vs-wyoming-llc/`, `/delaware-vs-home-state-llc/` "and similar pairs — the tool preset to two columns."

My recommendation is **build four, not the pattern**, and **drop the home-state pattern entirely**. Reasoning below.

### The test each page has to pass

A pair page earns its place only if find-and-replace fails on it: swap one state's name for another throughout, and the page must stop being true. If it still reads correctly, it is templated filler and the duplicate gate should reject it — the gate fails siblings at 70% similarity, and two-column preset pages are exactly the shape that trips it.

That test is what separates the four below from the twenty others one could name.

### Recommended — four pages

| URL | Why find-and-replace fails on it |
|---|---|
| `/california-vs-wyoming-llc/` | **The strongest page available.** California's $800 minimum reaches an out-of-state LLC owned by a California resident whether or not it registers — FTB treats you as doing business if you transact for gain in California. And because Wyoming levies no income tax, there is **no other-state tax to credit**, so the offset is zero and the full California rate applies. Swap in any other state and both halves of that stop being true. |
| `/delaware-vs-wyoming-llc/` | Two genuinely different regimes, not two price points. Delaware: a franchise tax with **two calculation methods** and a default that overcharges, plus a flat $300 LLC tax and no LLC annual report. Wyoming: **no franchise tax at all**, and a licence tax that is the greater of $60 or $0.0002 per dollar of Wyoming-situs assets. Neither description survives a name swap. |
| `/wyoming-vs-nevada-llc/` | Both are sold on privacy and low cost, which is why the comparison is searched — and the cost claim is false for one of them. Wyoming runs about **$60 a year**; Nevada is **$150 annual list plus a $200 business licence, every year**, with an Initial List duplicating the $150 in year one. Roughly a sixfold difference between two states marketed identically. |
| `/delaware-vs-nevada-llc/` | The two "incorporate here" destinations, and their costs diverge in opposite directions by entity. Delaware corp franchise scales on shares with a $250,000 cap for large filers; Nevada's corp **formation and annual list both scale on authorized share value**, to $35,000 and $11,125. A founder choosing between them on price needs both share-based schedules, which no other pair needs. |

### Recommended against — the home-state pattern

`/delaware-vs-home-state-llc/` is not a pair. "Home state" is a variable, so it resolves to one of two things and both are bad:

- **One page with a picker** — which is the hub, already built. A second URL for the same tool is a duplicate with extra steps.
- **51 pages** — Delaware against each state. That is the exact shape the duplicate gate exists to catch, and it would deserve to fail: the Delaware half is identical on all 51 and the home-state half is a fee table.

The hub already answers "Delaware versus where I live" for every state, with the reader's own numbers. A URL per state adds no answer.

### Two-axis check

Calculator × state-pair is **one** axis of variation. Confirmed: no entity-type URLs (`/delaware-vs-wyoming-llc-vs-s-corp/` and similar) — that would be a second axis and is explicitly out. Entity type stays an input on the page, as it is on the hub.

Four pages, one axis.

### What each page would contain

- The two-column comparison, preset, with the reader's operating state still an input — because the answer depends on it and presetting it would fabricate the premise.
- The myth warning in full, as on every spoke.
- **The specific asymmetry**, which is the page's reason to exist and the thing that fails find-and-replace.
- Both states' real regimes from the dataset, not a price table.
- The `unquantified` markers, since Nevada and Delaware both carry share-scaled fees stored as minimums.

### Risks, stated plainly

1. **Duplicate gate.** Four pair pages sharing a calculator and a myth warning will sit close together. The asymmetry paragraphs are what pull them apart, and if they do not, the gate will fail the build and the right response is to cut pages rather than pad them.
2. **Marginal value over the hub.** Honestly assessed: the hub plus three spokes already answer these questions. These four pages are a search-intent play, not a coverage gap. That is a legitimate reason to build them and not a reason to pretend otherwise.
3. **Nevada and Delaware figures are minimums.** Both have share-scaled fees. Any page comparing them on price has to say so prominently or it misleads at exactly the moment it is most persuasive.

### If approved

Four pages. Build order by strength: California/Wyoming first, since it is the one with a verified legal asymmetry behind it rather than a fee difference.

### If not approved

Nothing is lost. The hub answers all four questions with the reader's own numbers, which is the better answer in every case except search visibility.
