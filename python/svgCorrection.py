import sys
import json
from svgpathtools import parse_path

# Compute bounding box manually
# since svgpathtools.bbox isn't exposed directly

def get_path_bbox(path):
    xs = []
    ys = []
    for segment in path:
        # collect end points and any control points
        pts = [segment.start, segment.end]
        if hasattr(segment, 'control1'):
            pts.append(segment.control1)
        if hasattr(segment, 'control2'):
            pts.append(segment.control2)
        xs.extend(p.real for p in pts)
        ys.extend(p.imag for p in pts)
    return min(xs), min(ys), max(xs), max(ys)


def scale_and_translate_path(replacement_path, target_bbox):
    # target_bbox = (tx0, ty0, tx1, ty1)
    rx0, ry0, rx1, ry1 = get_path_bbox(replacement_path)
    tx0, ty0, tx1, ty1 = target_bbox

    # compute dimensions
    rw, rh = rx1 - rx0, ry1 - ry0
    tw, th = tx1 - tx0, ty1 - ty0

    # uniform scale factor to fit
    scale = min(tw / rw, th / rh)

    # scale and then re-compute bbox
    scaled = replacement_path.scaled(scale)
    sx0, sy0, _, _ = get_path_bbox(scaled)

    # translate so top-left corners align
    dx = tx0 - sx0
    dy = ty0 - sy0
    translated = scaled.translated(complex(dx, dy))
    return translated


def main():
    # Read JSON {"d1": "pathData1", "d2": "pathData2"} from stdin
    data = json.load(sys.stdin)

    # Parse SVG "d" strings into Path objects
    original_path    = parse_path(data["d1"])
    replacement_path = parse_path(data["d2"])

    # Compute bbox of original and adjust replacement to match
    original_bbox = get_path_bbox(original_path)
    adjusted_path = scale_and_translate_path(replacement_path, original_bbox)

    # Output the transformed path as a "d" string
    print(json.dumps({
        "path": adjusted_path.d()
    }))

    sys.exit(0)

if __name__ == "__main__":
    main()
