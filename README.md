# Continuous ML workflow

An offline, interactive explainer for a continuous machine-learning pipeline built from
Git, CI, Jupyter, Airflow, ClickHouse and MLflow. Nothing in it connects to a real server.

**Live page:** https://rathpiseyalpha.github.io/mlops-ex1/

To publish it, open the repository on GitHub, go to Settings, then Pages, and choose "Deploy from a branch" with branch `main` and folder `/ (root)`. The URL above works a minute or two after that.

To run it locally, open `index.html` in a browser. No build step and no network access are needed.

## Tabs

| Tab | What it shows |
|---|---|
| Watch it run | Animated network with curved, labelled arrows, the step explanation and test-gate lamps beside it, and ten scenarios. Zoom, pan and full screen |
| Node roles | What each server does, keeps, talks to, and leaves to others, with an MLflow spotlight |
| Sequence | Message-by-message order of one full cycle. Zoom, pan and full screen |
| Swimlane | Who does each step and where a run can stop. Zoom, pan and full screen |
| What gets tested | Code, data, model and monitoring tests |
| MLOps coverage | The page graded against the 28-test ML Test Score rubric |
| How to build it | How to extend a three-task Iris project into this loop |

## Layout

```
index.html          page structure and the icon sprite
css/tokens.css      color, type, space, radius, icon and arrow tokens (light and dark)
css/base.css        reset, typography, top bar, tabs
css/simulator.css   controls, network, gate rail, step panel
css/content.css     lessons, coverage, roles, diagrams
css/zoom.css        zoom bar, pan and full-screen styles
css/responsive.css  breakpoints, reduced motion, print
js/theme-init.js    sets the theme before first paint
js/simulation.js    scenarios, arrows, gate lamps, tabs
js/diagrams.js      sequence and swimlane diagrams, drawn from data
js/zoom.js          zoom, pan and full screen for the network and both diagrams
```

Zoom: use the minus, plus and Fit buttons, or hold Ctrl and scroll. Drag to move around when zoomed in.

The tech-stack icons are simplified redraws on a shared 32px grid, not the official logos.
