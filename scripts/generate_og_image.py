import os
import struct
import zlib

def make_png(filename, width, height, bg_rgb=(29, 78, 216), accent_rgb=(16, 185, 129)):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    raw_data = bytearray()
    
    for y in range(height):
        raw_data.append(0)  # Filter type 0 (None)
        for x in range(width):
            # Gradient + accent bar at top and bottom
            if y < 16 or y > height - 16 or x < 16 or x > width - 16:
                r, g, b = accent_rgb
            else:
                # Soft blue gradient
                factor = x / width
                r = int(bg_rgb[0] * (1 - factor) + 15 * factor)
                g = int(bg_rgb[1] * (1 - factor) + 23 * factor)
                b = int(bg_rgb[2] * (1 - factor) + 42 * factor)
            raw_data.extend([r, g, b])
            
    compressed = zlib.compress(bytes(raw_data), 9)
    
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)
        
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    png.extend(chunk(b'IHDR', ihdr))
    png.extend(chunk(b'IDAT', compressed))
    png.extend(chunk(b'IEND', b''))
    
    with open(filename, 'wb') as f:
        f.write(png)
    print(f"Generated {filename} ({os.path.getsize(filename)} bytes)")

if __name__ == '__main__':
    make_png('assets/images/og-preview.png', 1200, 630)
