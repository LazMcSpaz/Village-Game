"""Generate pixel art assets for the village builder game."""
from PIL import Image, ImageDraw
import os

ASSETS = os.path.dirname(os.path.abspath(__file__)) + "/../village-game/src/assets"

def draw_pixel(draw, x, y, color, scale=1):
    """Draw a single pixel at scale."""
    draw.rectangle([x*scale, y*scale, (x+1)*scale-1, (y+1)*scale-1], fill=color)

def draw_pixels(draw, pixels, scale=1):
    """Draw multiple pixels. pixels = [(x,y,color), ...]"""
    for x, y, color in pixels:
        draw_pixel(draw, x, y, color, scale)

# ============================================================
# BARRACKS - 128x96 pixel art
# ============================================================
def generate_barracks():
    W, H = 128, 96
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)

    # Foundation/base
    d.rectangle([8, 72, 120, 95], fill=(80, 60, 40))
    d.rectangle([10, 74, 118, 93], fill=(100, 75, 50))

    # Main wall
    wall = (120, 90, 65)
    wall_dark = (95, 70, 50)
    wall_light = (140, 110, 80)
    d.rectangle([14, 28, 114, 72], fill=wall)
    # Stone pattern
    for row in range(28, 72, 8):
        offset = 4 if (row // 8) % 2 == 0 else 0
        for col in range(14 + offset, 114, 16):
            d.rectangle([col, row, min(col+14, 114), row+6], outline=wall_dark)
            d.rectangle([col+1, row+1, min(col+4, 114), row+3], fill=wall_light)

    # Door
    d.rectangle([50, 48, 78, 72], fill=(60, 40, 25))
    d.rectangle([52, 50, 76, 72], fill=(45, 30, 18))
    # Door handle
    d.rectangle([72, 60, 74, 62], fill=(180, 160, 50))
    # Door arch
    d.arc([48, 42, 80, 58], 180, 0, fill=(80, 60, 40), width=2)

    # Windows
    for wx in [22, 92]:
        d.rectangle([wx, 38, wx+14, 52], fill=(40, 30, 20))
        d.rectangle([wx+1, 39, wx+13, 51], fill=(60, 80, 120))
        d.line([wx+7, 39, wx+7, 51], fill=(40, 30, 20), width=1)
        d.line([wx+1, 45, wx+13, 45], fill=(40, 30, 20), width=1)

    # Roof
    roof = (140, 45, 35)
    roof_dark = (110, 35, 25)
    roof_light = (170, 60, 45)
    # Main roof triangle
    points = [(6, 30), (64, 4), (122, 30)]
    d.polygon(points, fill=roof)
    # Roof tiles
    for row_i, ry in enumerate(range(8, 30, 5)):
        offset = 3 if row_i % 2 == 0 else 0
        for rx in range(10 + offset, 118, 10):
            y_at_x = 30 - (30 - 4) * (1 - abs(rx - 64) / 58)
            if ry >= y_at_x:
                d.rectangle([rx, ry, rx+8, ry+4], outline=roof_dark)
                d.rectangle([rx+1, ry+1, rx+3, ry+2], fill=roof_light)

    # Banner/flag
    d.rectangle([62, 0, 66, 10], fill=(80, 60, 40))
    # Flag
    flag_points = [(66, 0), (82, 4), (66, 8)]
    d.polygon(flag_points, fill=(180, 30, 30))
    d.polygon([(66, 1), (78, 4), (66, 7)], fill=(200, 50, 40))

    # Weapon rack on side
    d.rectangle([116, 50, 120, 72], fill=(80, 60, 40))
    d.line([114, 52, 114, 68], fill=(150, 150, 160), width=2)  # sword
    d.line([122, 54, 122, 66], fill=(150, 150, 160), width=2)  # sword

    # Shield on wall
    d.ellipse([30, 55, 42, 67], fill=(60, 60, 160))
    d.ellipse([32, 57, 40, 65], fill=(80, 80, 180))
    d.line([36, 55, 36, 67], fill=(180, 160, 50), width=1)
    d.line([30, 61, 42, 61], fill=(180, 160, 50), width=1)

    img.save(f"{ASSETS}/buildings/barracks.png")
    print("Generated barracks.png")

# ============================================================
# HOUSE - 80x72
# ============================================================
def generate_house():
    W, H = 80, 72
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)

    # Wall
    d.rectangle([10, 30, 70, 71], fill=(160, 130, 90))
    d.rectangle([12, 32, 68, 69], fill=(180, 150, 105))

    # Door
    d.rectangle([32, 48, 48, 71], fill=(100, 60, 30))
    d.rectangle([34, 50, 46, 71], fill=(80, 50, 25))
    d.rectangle([43, 58, 45, 60], fill=(200, 180, 60))

    # Window
    d.rectangle([54, 38, 64, 48], fill=(60, 80, 130))
    d.line([59, 38, 59, 48], fill=(50, 35, 20), width=1)
    d.line([54, 43, 64, 43], fill=(50, 35, 20), width=1)
    d.rectangle([54, 38, 64, 48], outline=(50, 35, 20))

    # Roof
    points = [(4, 32), (40, 6), (76, 32)]
    d.polygon(points, fill=(170, 80, 40))
    d.polygon([(6, 31), (40, 8), (74, 31)], fill=(190, 95, 50))

    # Chimney
    d.rectangle([56, 8, 64, 24], fill=(130, 100, 70))

    img.save(f"{ASSETS}/buildings/house.png")
    print("Generated house.png")

# ============================================================
# MARKET - 90x70
# ============================================================
def generate_market():
    W, H = 90, 70
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)

    # Counter/stand
    d.rectangle([8, 40, 82, 69], fill=(140, 100, 60))
    d.rectangle([10, 42, 80, 67], fill=(160, 120, 75))

    # Awning poles
    d.rectangle([10, 16, 14, 42], fill=(100, 70, 40))
    d.rectangle([76, 16, 80, 42], fill=(100, 70, 40))

    # Awning (striped)
    for i, x in enumerate(range(6, 84, 8)):
        color = (180, 40, 40) if i % 2 == 0 else (220, 200, 160)
        d.rectangle([x, 12, x+8, 22], fill=color)
    # Awning bottom edge
    for x in range(6, 84, 4):
        d.polygon([(x, 22), (x+2, 26), (x+4, 22)], fill=(180, 40, 40))

    # Goods on counter
    d.ellipse([16, 44, 28, 52], fill=(200, 50, 30))  # apple
    d.ellipse([30, 44, 42, 52], fill=(220, 180, 40))  # cheese
    d.ellipse([46, 44, 56, 52], fill=(120, 180, 60))  # vegetable
    d.rectangle([60, 42, 74, 54], fill=(180, 140, 80))  # bread
    d.rectangle([62, 44, 72, 52], fill=(200, 160, 90))

    img.save(f"{ASSETS}/buildings/market.png")
    print("Generated market.png")

# ============================================================
# TAVERN - 90x80
# ============================================================
def generate_tavern():
    W, H = 90, 80
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)

    # Wall
    d.rectangle([8, 32, 82, 79], fill=(130, 95, 60))
    d.rectangle([10, 34, 80, 77], fill=(150, 115, 75))

    # Door (wide)
    d.rectangle([32, 52, 58, 79], fill=(90, 55, 28))
    d.rectangle([34, 54, 56, 79], fill=(75, 45, 22))
    d.rectangle([52, 64, 54, 66], fill=(200, 180, 60))

    # Windows with warm glow
    for wx in [14, 64]:
        d.rectangle([wx, 40, wx+12, 50], fill=(50, 40, 25))
        d.rectangle([wx+1, 41, wx+11, 49], fill=(200, 160, 60))  # warm light
        d.rectangle([wx, 40, wx+12, 50], outline=(50, 40, 25))

    # Roof
    d.polygon([(2, 34), (45, 6), (88, 34)], fill=(100, 75, 45))
    d.polygon([(4, 33), (45, 8), (86, 33)], fill=(120, 90, 55))

    # Sign hanging
    d.rectangle([44, 14, 46, 28], fill=(80, 60, 35))
    d.rectangle([36, 26, 54, 38], fill=(60, 45, 25))
    d.rectangle([38, 28, 52, 36], fill=(80, 60, 35))
    # Mug icon on sign
    d.rectangle([42, 29, 48, 35], fill=(200, 180, 60))
    d.rectangle([48, 31, 50, 33], fill=(200, 180, 60))

    img.save(f"{ASSETS}/buildings/tavern.png")
    print("Generated tavern.png")

# ============================================================
# FARM - 100x64
# ============================================================
def generate_farm():
    W, H = 100, 64
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)

    # Barn
    d.rectangle([4, 20, 44, 63], fill=(150, 55, 35))
    d.rectangle([6, 22, 42, 61], fill=(170, 70, 45))

    # Barn door
    d.rectangle([16, 38, 32, 63], fill=(120, 45, 25))
    d.line([24, 38, 24, 63], fill=(100, 35, 20), width=1)
    # X pattern
    d.line([17, 39, 31, 62], fill=(100, 35, 20), width=1)
    d.line([31, 39, 17, 62], fill=(100, 35, 20), width=1)

    # Barn roof
    d.polygon([(0, 22), (24, 4), (48, 22)], fill=(100, 75, 50))

    # Crops
    for cx in range(52, 96, 6):
        # Wheat stalks
        d.line([cx, 63, cx, 48], fill=(160, 140, 40), width=1)
        d.line([cx+2, 63, cx+2, 50], fill=(140, 130, 35), width=1)
        # Wheat heads
        d.ellipse([cx-1, 44, cx+1, 50], fill=(200, 180, 50))
        d.ellipse([cx+1, 46, cx+3, 52], fill=(180, 170, 45))

    # Fence
    for fx in range(50, 98, 10):
        d.rectangle([fx, 56, fx+2, 63], fill=(140, 110, 70))
    d.rectangle([50, 58, 98, 60], fill=(140, 110, 70))

    img.save(f"{ASSETS}/buildings/farm.png")
    print("Generated farm.png")

# ============================================================
# BACKGROUND - Sky gradient (800x400, tileable)
# ============================================================
def generate_sky():
    W, H = 800, 400
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)

    # Gradient sky - dusk/evening colors
    colors = [
        (15, 5, 30),    # deep purple
        (25, 12, 50),
        (40, 20, 65),
        (55, 30, 80),
        (75, 45, 95),
        (110, 65, 100),
        (150, 90, 90),
        (190, 120, 80),
        (210, 155, 80),
        (230, 185, 100),
    ]

    strip_h = H // len(colors)
    for i, color in enumerate(colors):
        y1 = i * strip_h
        y2 = (i + 1) * strip_h
        if i < len(colors) - 1:
            # Dither between this and next color
            nc = colors[i+1]
            for y in range(y1, y2):
                t = (y - y1) / strip_h
                r = int(color[0] * (1-t) + nc[0] * t)
                g = int(color[1] * (1-t) + nc[1] * t)
                b = int(color[2] * (1-t) + nc[2] * t)
                d.line([(0, y), (W, y)], fill=(r, g, b))
        else:
            d.rectangle([0, y1, W, y2], fill=color)

    # Stars
    import random
    random.seed(42)
    for _ in range(60):
        x = random.randint(0, W)
        y = random.randint(0, H // 2)
        brightness = random.randint(180, 255)
        size = random.choice([1, 1, 1, 2])
        d.rectangle([x, y, x+size, y+size], fill=(brightness, brightness, brightness + random.randint(-20, 0)))

    # Moon
    d.ellipse([620, 30, 660, 70], fill=(240, 235, 210))
    d.ellipse([628, 28, 664, 68], fill=(0, 0, 0, 0))  # crescent shadow

    img.save(f"{ASSETS}/environment/sky.png")
    print("Generated sky.png")

# ============================================================
# MOUNTAINS - 1600x200, tileable
# ============================================================
def generate_mountains():
    W, H = 1600, 200
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)

    # Back mountains (darker, taller)
    peaks_back = [
        (0, 140), (80, 60), (200, 100), (300, 40), (420, 90),
        (500, 50), (620, 80), (720, 30), (850, 70), (950, 45),
        (1050, 85), (1150, 35), (1280, 65), (1380, 50), (1500, 80), (1600, 140)
    ]
    peaks_back.append((1600, 200))
    peaks_back.insert(0, (0, 200))
    d.polygon(peaks_back, fill=(40, 30, 55))

    # Front mountains (lighter, shorter)
    peaks_front = [
        (0, 160), (100, 100), (220, 130), (350, 85), (450, 120),
        (580, 90), (680, 110), (800, 75), (920, 105), (1020, 80),
        (1140, 115), (1260, 90), (1360, 100), (1480, 110), (1600, 160)
    ]
    peaks_front.append((1600, 200))
    peaks_front.insert(0, (0, 200))
    d.polygon(peaks_front, fill=(55, 45, 70))

    # Snow caps on back peaks
    snow_peaks = [(80, 60), (300, 40), (500, 50), (720, 30), (950, 45), (1150, 35), (1380, 50)]
    for px, py in snow_peaks:
        d.polygon([(px-15, py+20), (px, py), (px+15, py+20)], fill=(180, 175, 200))

    img.save(f"{ASSETS}/environment/mountains.png")
    print("Generated mountains.png")

# ============================================================
# GROUND - 64x64 tileable grass/dirt
# ============================================================
def generate_ground():
    W, H = 64, 64
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)

    import random
    random.seed(123)

    # Base dirt
    d.rectangle([0, 0, 63, 63], fill=(70, 55, 35))

    # Variation pixels
    for x in range(64):
        for y in range(64):
            if random.random() < 0.3:
                v = random.randint(-15, 15)
                d.point((x, y), fill=(70+v, 55+v, 35+v//2))

    # Top grass edge
    for x in range(64):
        grass_h = random.randint(6, 14)
        for y in range(grass_h):
            g = random.randint(50, 80)
            d.point((x, y), fill=(40+g//4, 80+g, 30+g//3))

    # Some grass tufts
    for _ in range(8):
        gx = random.randint(0, 60)
        for i in range(3):
            d.line([(gx+i*2, 10), (gx+i*2-1, 3)], fill=(50, 130, 40), width=1)

    img.save(f"{ASSETS}/environment/ground.png")
    print("Generated ground.png")

# ============================================================
# TREES - individual tree sprite 48x80
# ============================================================
def generate_tree():
    W, H = 48, 80
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)

    # Trunk
    d.rectangle([20, 45, 28, 79], fill=(90, 65, 35))
    d.rectangle([22, 47, 26, 77], fill=(110, 80, 45))

    # Foliage layers
    d.polygon([(8, 50), (24, 20), (40, 50)], fill=(30, 90, 30))
    d.polygon([(10, 40), (24, 12), (38, 40)], fill=(40, 110, 40))
    d.polygon([(14, 30), (24, 6), (34, 30)], fill=(50, 130, 50))

    # Highlights
    d.polygon([(16, 38), (24, 14), (28, 38)], fill=(55, 140, 55))

    img.save(f"{ASSETS}/environment/tree.png")
    print("Generated tree.png")

# ============================================================
# OFF-SCREEN BATTLE ARROW INDICATOR - 48x48
# ============================================================
def generate_battle_arrow():
    W, H = 48, 48
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)

    # Arrow pointing right
    # Shaft
    d.rectangle([4, 20, 30, 28], fill=(200, 50, 40))
    d.rectangle([6, 22, 28, 26], fill=(230, 70, 50))

    # Arrowhead
    d.polygon([(28, 14), (44, 24), (28, 34)], fill=(200, 50, 40))
    d.polygon([(30, 17), (40, 24), (30, 31)], fill=(230, 70, 50))

    # Exclamation/alert glow
    d.rectangle([16, 8, 20, 16], fill=(255, 220, 50))
    d.rectangle([16, 18, 20, 20], fill=(255, 220, 50))

    img.save(f"{ASSETS}/environment/battle-arrow-right.png")

    # Arrow pointing left (flip)
    img_left = img.transpose(Image.FLIP_LEFT_RIGHT)
    img_left.save(f"{ASSETS}/environment/battle-arrow-left.png")

    print("Generated battle arrows")

if __name__ == "__main__":
    os.makedirs(f"{ASSETS}/buildings", exist_ok=True)
    os.makedirs(f"{ASSETS}/environment", exist_ok=True)

    generate_barracks()
    generate_house()
    generate_market()
    generate_tavern()
    generate_farm()
    generate_sky()
    generate_mountains()
    generate_ground()
    generate_tree()
    generate_battle_arrow()

    print("\nAll assets generated!")
