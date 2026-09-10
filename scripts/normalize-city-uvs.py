"""Remove redundant default UV selectors from city GLBs for Three r137."""
import json
import struct
from pathlib import Path

for path in (Path(__file__).resolve().parents[1] / 'public/room/city').glob('*.glb'):
    data = path.read_bytes()
    length, kind = struct.unpack_from('<II', data, 12)
    assert kind == 0x4E4F534A
    document = json.loads(data[20:20 + length])

    def normalize(value):
        if isinstance(value, dict):
            transform = value.get('extensions', {}).get('KHR_texture_transform', {})
            # Removing this override is equivalent only when the base set is 0.
            if transform.get('texCoord') == 0 and value.get('texCoord', 0) == 0:
                del transform['texCoord']
            for child in value.values():
                normalize(child)
        elif isinstance(value, list):
            for child in value:
                normalize(child)

    normalize(document)
    chunk = json.dumps(document, separators=(',', ':')).encode()
    chunk += b' ' * (-len(chunk) % 4)
    tail = data[20 + length:]
    path.write_bytes(data[:8] + struct.pack('<I', 20 + len(chunk) + len(tail))
                     + struct.pack('<II', len(chunk), kind) + chunk + tail)
