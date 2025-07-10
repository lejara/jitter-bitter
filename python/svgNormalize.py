#!/usr/bin/env python3
import sys
import re
from svgpathtools import parse_path, Path

def canonicalize(d, precision=3):
    # parse and normalize
    p = parse_path(d)
    # collect all segment endpoints
    pts = [seg.start for seg in p] + [seg.end for seg in p]
    xs = [pt.real for pt in pts]
    ys = [pt.imag for pt in pts]
    minx, miny = min(xs), min(ys)
    # translate so top-left corner is origin
    p = p.translated(-minx - 1j*miny)
    # serialize entire path
    raw = p.d()  # Path.d() returns an SVG path-data string
    # regex to find floats (including integers)
    float_re = re.compile(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?")
    # round all numbers to fixed precision
    def _round(match):
        return f"{float(match.group()):.{precision}f}"
    rounded = float_re.sub(_round, raw)
    print(rounded, end='')

if __name__ == "__main__":
    if len(sys.argv) > 1:
        d = sys.argv[1]
    else:
        d = sys.stdin.read().strip()
    canonicalize(d)