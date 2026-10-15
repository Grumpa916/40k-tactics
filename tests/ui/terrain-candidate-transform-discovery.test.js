import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";

const SOURCE = Object.freeze({
  24: [["15\"","left",15.01,39.94],["4\"","top",15,39.93],["8\"","top",24.94,36.03],["31\"","left",31.2,13.98],["14\"","bottom",31.2,13.98],["3\"","top",34.02,41.03],["27\"","right",33.14,34.7],["26\"","right",34.02,40.94],["16\"","top",41.1,28.03],["19\"","right",41.1,28.02],["14\"","bottom",42.69,14.09],["5\"","top",44.58,39.07],["15\"","right",45.08,27.61],["7\"","bottom",51.01,7.07],["21\"","bottom",56.14,20.93],["5\"","right",54.89,7.07],["5\"","right",55.09,13.03],["4\"","right",56.07,20.94],["4\"","right",56.14,32.02],["4\"","right",55.99,39.05]],
  25: [["12\"","left",12.03,42.97],["20\"","left",19.93,1.06],["26\"","left",25.97,45.07],["26\"","left",25.97,26.5],["26\"","left",25.97,37.92],["6\"","top",32.97,38.03],["4\"","top",37.12,40.03],["15\"","top",38.08,29.03],["2\"","bottom",39.01,2.11],["22\"","right",38.08,29.07],["20\"","right",40.15,16.5],["20\"","bottom",41.96,19.95],["19\"","right",40.98,34.12],["4\"","top",40.89,40.11],["18\"","right",41.94,19.95],["2\"","bottom",45.98,2.04],["14\"","right",45.98,2.08],["26\"","right",34.05,-1],["7\"","bottom",50.07,7.04],["11\"","right",48.9,38.85],["20\"","right",40.05,42.97],["10\"","right",50.03,13.04],["10\"","right",50.02,22.95],["18\"","top",52.04,26.09],["8\"","right",52,26.08],["12\"","right",48.07,1.06]],
  26: [["19\"","top",-1.03,25.04],["14\"","bottom",1,14.02],["8\"","top",1,36],["17\"","left",17.02,32.05],["21\"","left",21.01,38.97],["5\"","top",21.06,38.98],["26\"","left",26.04,37.1],["7\"","top",26.04,37.15],["5\"","top",27.52,38.92],["13\"","top",33.97,30.94],["6\"","top",39.15,38.02],["21\"","right",39.21,38.06],["20\"","right",40.08,14.57],["5\"","top",44.59,38.89],["15\"","top",46.06,29.01],["14\"","right",46.1,28.97],["12\"","bottom",50.06,12.07],["17\"","top",53.13,26.98],["7\"","right",53.17,27.02],["12\"","bottom",55.94,11.97],["5\"","top",56.07,38.94],["4\"","right",55.94,11.98],["4\"","right",56.07,31.97],["8\"","bottom",59.1,8.04],["14\"","top",59.1,30.02],["19\"","bottom",61.02,19]],
  27: [["25\"","left",24.96,40.07],["21\"","bottom",30.78,21.01],["9\"","top",32.98,34.95],["17\"","top",36.04,27.12],["3\"","top",37.08,41.02],["24\"","right",36.06,27.1],["3\"","top",41.05,41.09],["20\"","right",40.04,11],["19\"","right",41.18,41.08],["16\"","top",44.04,28.11],["16\"","right",44.05,28.11],["9\"","right",51.01,14.55],["8\"","bottom",53.09,7.94],["22\"","top",54.14,22.03],["7\"","right",53.14,7.93],["6\"","top",55.01,38.09],["6\"","right",54.02,22.03],["5\"","right",54.95,30.97],["5\"","right",54.99,38.05]],
  28: [["12\"","left",12.03,42.97],["20\"","left",19.93,1.06],["26\"","left",25.97,45.07],["28\"","left",27.86,38.99],["5\"","top",30.07,39.05],["15\"","bottom",33.02,15.06],["27\"","right",32.99,15.04],["9\"","top",36.06,34.96],["4\"","bottom",39.03,4.12],["24\"","top",39.48,20.01],["3\"","top",42.09,40.88],["4\"","bottom",45.93,4.26],["14\"","right",45.96,4.2],["14\"","right",46.04,37.01],["26\"","right",34.05,-.88],["9\"","bottom",49.61,8.97],["20\"","right",40.05,42.97],["9\"","top",52.12,34.96],["8\"","right",52.12,18.93],["8\"","right",52.12,8.97],["14\"","top",54.07,29.96],["8\"","right",52.12,34.96],["12\"","right",48.07,1.06],["6\"","right",54.13,23.03],["6\"","right",54.13,29.96]],
  29: [["19\"","top",-1.03,25.04],["14\"","bottom",1,13.95],["8\"","top",1,36],["6\"","top",7.98,38.06],["17\"","left",17.01,40.01],["4\"","top",17.05,40.05],["6\"","top",20.8,37.99],["25\"","left",25.02,34.55],["16\"","bottom",26.59,16.1],["27\"","left",27.07,38.05],["6\"","top",27.02,37.99],["4\"","top",35.45,40.08],["15\"","bottom",38.02,15.05],["12\"","top",37.88,31.97],["22\"","right",38.1,15.03],["22\"","right",37.86,32.02],["5\"","top",43.47,39.06],["20\"","top",44.64,24.08],["10\"","right",49.93,25.62],["5\"","top",55.05,38.99],["22\"","top",56.02,21.92],["5\"","right",55.06,39],["4\"","right",55.99,21.98],["8\"","bottom",59.1,8.04],["14\"","top",59.1,30.02],["19\"","bottom",61.02,19]],
  30: [["18\"","left",17.99,42.97],["4\"","bottom",29.48,4.02],["18\"","top",31.14,26.06],["29\"","right",31.11,26.06],["4\"","top",37.05,39.95],["23\"","right",37.04,29.74],["23\"","right",37.04,39.95],["21\"","right",39.12,14.44],["4\"","bottom",41.05,4.02],["19\"","right",40.97,4.06],["13\"","top",45.01,30.93],["3\"","top",46.98,40.98],["5\"","bottom",49.94,5],["12\"","right",47.93,16.98],["10\"","right",49.89,5],["10\"","right",49.89,11.01],["18\"","right",42.03,42.97],["7\"","top",53.11,36.98],["8\"","right",52.13,19.31],["8\"","right",51.97,30.93],["7\"","right",53.11,37.02]],
  31: [["12\"","bottom",.93,12],["4\"","left",3.87,23.03],["4\"","left",3.79,30.03],["14\"","top",3.79,30.03],["4\"","top",8.2,40.04],["9\"","top",12.26,35.08],["4\"","top",15.55,40.04],["18\"","left",18.87,37.85],["21\"","left",21,28.11],["16\"","top",21.12,28.11],["7\"","top",23.93,37],["29\"","left",28.99,19.97],["3\"","top",33.6,41.04],["3\"","top",45.03,40.93],["15\"","right",44.92,30.14],["15\"","right",45.09,40.92],["18\"","top",49.39,26.15],["9\"","top",54.44,35],["5\"","right",54.44,35.01],["12\"","top",59.08,32.07]],
  32: [["15\"","left",15.01,45.09],["6\"","top",24.04,38],["15\"","bottom",30.78,15.04],["10\"","top",34.06,34.08],["16\"","top",36.04,28.05],["24\"","right",36.04,28.05],["17\"","top",42.56,27.03],["4\"","top",44.08,39.93],["4\"","bottom",45.21,4.07],["16\"","right",44.08,40],["8\"","bottom",50.97,8.02],["15\"","bottom",52.11,14.93],["9\"","right",50.95,8.02],["15\"","right",45.07,-1],["8\"","right",52.1,15.03],["8\"","right",52.01,20.94],["7\"","top",55.09,36.9],["5\"","right",55.08,25.51],["5\"","right",55.04,36.9]]
});

const TRANSFORMS = ["identity", "flipX", "flipY", "rotate180"];

function transform(row, name) {
  const [value, edge, x, y] = row;
  if (name === "flipX") return { value, point: [60 - x, y], edge: edge === "left" ? "right" : edge === "right" ? "left" : edge };
  if (name === "flipY") return { value, point: [x, 44 - y], edge: edge === "top" ? "bottom" : edge === "bottom" ? "top" : edge };
  if (name === "rotate180") return { value, point: [60 - x, 44 - y], edge: edge === "left" ? "right" : edge === "right" ? "left" : edge === "top" ? "bottom" : edge === "bottom" ? "top" : edge };
  return { value, point: [x, y], edge };
}

function vertices(layout) {
  const result = [];
  for (const [terrain, shape] of Object.entries(layout.terrainGeometry ?? {})) {
    for (const point of shape.points ?? []) result.push({ terrain, point: [Number(point.x), Number(point.y)] });
  }
  return result;
}

function nearest(list, target) {
  let best = null;
  for (const vertex of list) {
    const distance = Math.hypot(vertex.point[0] - target[0], vertex.point[1] - target[1]);
    if (!best || distance < best.distance) best = { ...vertex, distance };
  }
  return best;
}

function score(layout, rows, name) {
  const list = vertices(layout);
  const matches = rows.map((row) => {
    const transformed = transform(row, name);
    return { ...transformed, nearest: nearest(list, transformed.point) };
  });
  const distances = matches.map((item) => item.nearest.distance).sort((a, b) => a - b);
  return {
    name,
    matches,
    near: distances.filter((distance) => distance <= .85).length,
    review: distances.filter((distance) => distance <= 1.5).length,
    median: distances[Math.floor(distances.length / 2)] ?? Infinity
  };
}

function better(a, b) {
  if (a.near !== b.near) return b.near - a.near;
  if (a.review !== b.review) return b.review - a.review;
  return a.median - b.median;
}

test("candidate batch 24-32 discovers source-frame transforms from V2 vertices without deriving measurement values", () => {
  const rows = [];
  for (const page of Object.keys(SOURCE).map(Number)) {
    const layout = EVENT_COMPANION_MAP_CATALOG.layouts.find((item) => Number(item.page) === page);
    assert.ok(layout, `page ${page} geometry exists`);
    const scores = TRANSFORMS.map((name) => score(layout, SOURCE[page], name)).sort(better);
    const best = scores[0];
    rows.push({ page, transform: best.name, near: `${best.near}/${SOURCE[page].length}`, review: best.review, median: Number(best.median.toFixed(2)) });
    assert.ok(best.near >= Math.ceil(SOURCE[page].length * .45), `page ${page} has a meaningful geometry fit`);
  }
  console.log("TERRAIN_CANDIDATE_TRANSFORM_DISCOVERY");
  console.table(rows);
});
