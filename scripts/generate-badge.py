"""Build the original low-poly office badge as glTF 2.0 binary."""
import json
import struct
from pathlib import Path

DATA = bytearray()
VIEWS = []
ACCESSORS = []


def accessor(values, data_format, component, item_type, count, target, bounds=None):
    while len(DATA) % 4:
        DATA.append(0)
    offset = len(DATA)
    DATA.extend(struct.pack(f"<{len(values)}{data_format}", *values))
    VIEWS.append({"buffer": 0, "byteOffset": offset, "byteLength": len(DATA) - offset, "target": target})
    item = {"bufferView": len(VIEWS) - 1, "componentType": component, "count": count, "type": item_type}
    if bounds:
        item.update(min=bounds[0], max=bounds[1])
    ACCESSORS.append(item)
    return len(ACCESSORS) - 1


def box(center, half, material):
    faces = [
        ((0, 0, 1), [(-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]),
        ((0, 0, -1), [(1, -1, -1), (-1, -1, -1), (-1, 1, -1), (1, 1, -1)]),
        ((1, 0, 0), [(1, -1, 1), (1, -1, -1), (1, 1, -1), (1, 1, 1)]),
        ((-1, 0, 0), [(-1, -1, -1), (-1, -1, 1), (-1, 1, 1), (-1, 1, -1)]),
        ((0, 1, 0), [(-1, 1, 1), (1, 1, 1), (1, 1, -1), (-1, 1, -1)]),
        ((0, -1, 0), [(-1, -1, -1), (1, -1, -1), (1, -1, 1), (-1, -1, 1)]),
    ]
    positions, normals, indices = [], [], []
    for index, (normal, verts) in enumerate(faces):
        for vertex in verts:
            positions.extend(center[axis] + half[axis] * vertex[axis] for axis in range(3))
            normals.extend(normal)
        indices.extend(index * 4 + value for value in [0, 1, 2, 0, 2, 3])
    bounds = [[center[i] - half[i] for i in range(3)], [center[i] + half[i] for i in range(3)]]
    return {
        "attributes": {
            "POSITION": accessor(positions, "f", 5126, "VEC3", 24, 34962, bounds),
            "NORMAL": accessor(normals, "f", 5126, "VEC3", 24, 34962),
        },
        "indices": accessor(indices, "H", 5123, "SCALAR", 36, 34963),
        "material": material,
    }


parts = [
    box((0, 0, 0), (0.08, 0.021, 0.054), 0),
    box((0, 0.087, 0), (0.088, 0.061, 0.033), 1),
    box((0, 0.091, 0.035), (0.066, 0.044, 0.008), 0),
    box((-0.025, 0.096, 0.045), (0.009, 0.014, 0.003), 2),
    box((0.025, 0.096, 0.045), (0.009, 0.014, 0.003), 2),
    box((0.044, 0.16, 0), (0.008, 0.018, 0.008), 1),
]
model = {
    "asset": {"version": "2.0", "generator": "AI TOOK MY JOB badge script"},
    "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"mesh": 0}], "meshes": [{"primitives": parts}],
    "materials": [
        {"pbrMetallicRoughness": {"baseColorFactor": color, "metallicFactor": 0, "roughnessFactor": 0.8}}
        for color in [(0.015, 0.065, 0.07, 1), (0.93, 0.51, 0.12, 1), (0.18, 0.92, 0.61, 1)]
    ],
    "buffers": [{"byteLength": len(DATA)}], "bufferViews": VIEWS, "accessors": ACCESSORS,
}
metadata = json.dumps(model, separators=(",", ":")).encode("utf-8")
metadata += b" " * (-len(metadata) % 4)
DATA.extend(b"\x00" * (-len(DATA) % 4))
header = struct.pack("<4sII", b"glTF", 2, 28 + len(metadata) + len(DATA))
chunks = struct.pack("<I4s", len(metadata), b"JSON") + metadata
chunks += struct.pack("<I4s", len(DATA), b"BIN\x00") + DATA
Path(__file__).resolve().parents[1].joinpath("src/world/office-badge.glb").write_bytes(header + chunks)
