# Images: the house style

Kinocomputing reads like a good magazine: text first, images that earn their
place, one look throughout. These rules draw on Edward Tufte (show the data,
nothing else), Matthew Butterick's *Practical Typography* (restraint, one
typeface, real hierarchy) and Apple's Human Interface Guidelines (contrast,
legibility, never colour alone). The tokens are in `tokens.json`; the chart
style is `house.mplstyle`; `node tools/figure.mjs` draws sketches and
diagrams in the style, and checks any image against it.

## Two kinds of image

**Plates** say something. A hand-drawn-feeling illustration that carries an
idea rhetorically: a metaphor made visible (the memory wall as a wall, a
reservoir as a pond of ripples), a scene, a juxtaposition, a before and
after. One idea per plate; few or no labels; generous empty space; ink lines,
with the vermilion once, on the thing the reader should look at. Draw them
with `figure.mjs sketch`, which gives a pen's wobble. File names start
`plate-`. At most one per note, usually straight after the lead, where it
opens the piece the way a magazine's opener does. A deep dive may have one
per section.

**Figures** show something. Charts from the lab's data and diagrams of how a
thing works. File names start `fig-`. Charts with matplotlib and
`house.mplstyle`; diagrams with `figure.mjs diagram` (Mermaid, drawn in the
house theme); simple schematics as sketches with a low roughness. Placed
where the argument needs them, at the column's width.

At most three images in a note, five in a deep dive. Every image earns its
place: if the text says it as well, cut the image. The one exception is the
day's brief, which always opens with a plate: the day's cover (AGENT.md,
"The day's picture").

Look at every image before it goes out: `node tools/figure.mjs look
<file.svg> <out.png>` draws it on the page's colour, to open and judge.

## Colour

Draw on a transparent ground; images are made for the light page, and on the
site's dark page they sit on a light card.

| token | colour | for |
|---|---|---|
| ink | `#1a1a1a` | lines, text, the first series |
| ink-soft | `#333333` | labels, axes |
| grey | `#555555` | secondary text and lines |
| blue | `#2f5d8c` | the second series, emphasis |
| vermilion | `#c8553d` | the one accent: the point to see. Marks and lines only, never text |
| rule | `#a9c6ea` | gridlines and faint structure only, never meaning |
| paper-light | `#e6f1fe` | a filled shape that needs a light fill |

Series in order: ink, blue, vermilion, grey; never more than four. Colour is
never the only difference: label each series directly, or vary the line
(solid, dashed) or the marker. Blue against vermilion is the colour-blind-safe
pair.

## Type

One face, the sans (`tokens.json`); at most two sizes in an image; sentence
case; no bold and italic together. Capitals only for very short labels,
letter-spaced. Left-aligned labels; no centred blocks of text.

Every image is drawn on a canvas 640 units wide, and no text in it is
smaller than 20 units: on a phone the image shrinks to about half, and
smaller text can't be read. If a figure needs more labels than fit at that
size, split it into small multiples.

## Charts (Tufte)

- Every drop of ink shows data. No boxes, no backgrounds, no 3D, no shadows,
  no heavy grids: light horizontal gridlines at most, no top or right axis.
- Label series where they end, not in a legend; a legend only past four.
- Axes say their units. Scales start where honesty says (bars at zero).
- One annotation, in vermilion, marking the takeaway: an arrow and a few
  words on the chart itself, set in clear space — never across a line, a
  mark or another label. Look at the chart before it goes out.
- Comparisons as small multiples on the same scales, not one crowded chart.
- The caption ends with the source: "Source: the lab's experiment, code and
  data [linked]" or the paper.

## Captions and alt text

Every image has both, and they do different jobs.

- **The caption** (the markdown image's title) is for everyone: it says what
  to see and why it matters, in a sentence or two, the way a magazine
  caption does. Not "A chart of energy" but "Converters, not arithmetic, take
  most of the energy in small arrays; the share falls as arrays grow."
- **The alt text** is for a reader who can't see the image: what it shows
  and what it means, in plain words, a sentence or three. Never "image of".

## In a note

Put the image's file in a folder named after the note, beside it in the
outbox (`outbox/<name>/plate-wall.svg`), and place it on a line of its own:

```markdown
![A brick wall between a processor and a memory chip, with a thin trickle of
data squeezing through a gap](plate-wall.svg "The memory wall: moving data costs
more than computing on it.")
```

SVG for anything drawn (sketches, diagrams, charts); PNG only for what can't
be (a photograph, a scan), and then no larger than 1600 pixels across.
`node tools/figure.mjs check <file>` before the outbox: the publisher
applies the same checks and refuses an image that fails them.
