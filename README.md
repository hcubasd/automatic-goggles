# automatic-goggles

Static GitHub Pages demo for the full dynamic programming allocator discussed in
the research project.

## What This Repo Is

This repository hosts a browser-based implementation of the sequential
allocation algorithm with limited heterogeneous fleet availability. The app is a
small pseudo-product: it exposes the model as an interactive tool where a user
can define an ordered sequence of cargo units, configure vehicle classes, and
compute an exact allocation.

The current interface supports:

- ordered cargo input with weight and length
- heterogeneous vehicle classes with weight limit, length limit, minimum charge,
  spacing, and fleet size
- exact dynamic programming with explicit fleet-consumption state
- two objectives: minimum total charged weight or minimum number of vehicles
- reconstruction and visualization of the optimal partition

## Relationship To The Research

This demo is the implementation companion to the paper in:

- https://github.com/hcubasd/stunning-guide

Current PDF release of the article:

- https://github.com/hcubasd/stunning-guide/releases/download/v0.1.10/main.pdf

The paper develops the modeling progression behind the app:

1. set partitioning over contiguous intervals
2. simplified dynamic programming without effective fleet control
3. full dynamic programming with explicit resource tracking

This repository corresponds to the third item: the complete DP formulation.

## Project Structure

- `index.html`: page shell
- `assets/styles.css`: interface styling
- `assets/app.js`: browser-side allocator implementation

## Deployment

The app is fully static and intended to be served directly by GitHub Pages.
There is no build step and no workflow configured yet.
