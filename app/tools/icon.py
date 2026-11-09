# 从立绘裁一张方头图标，出 png（托盘）+ ico（exe 图标）
from PIL import Image, ImageDraw
import os, sys

这里 = os.path.dirname(os.path.abspath(__file__))
app根 = os.path.dirname(这里)
src = os.path.join(app根, "assets", "char.webp")
out = os.path.join(app根, "build")
os.makedirs(out, exist_ok=True)

im = Image.open(src).convert("RGBA")
w, h = im.size
print("src", w, h)

# 头在上半部分，取一个居中的方框（带一点肩部，看着像头像）
side = int(min(w, h * 0.52) * 0.96)
left = (w - side) // 2
top = int(h * 0.02)
box = (left, top, left + side, top + side)
head = im.crop(box).resize((512, 512), Image.LANCZOS)

# 圆形遮罩，外圈留一点透明
mask = Image.new("L", (512, 512), 0)
d = ImageDraw.Draw(mask)
d.ellipse((24, 24, 488, 488), fill=255)
head.putalpha(Image.composite(head.getchannel("A"), Image.new("L", (512, 512), 0), mask))

head.save(os.path.join(out, "icon.png"))
for sz in (16, 24, 32, 48, 64, 128, 256):
    head.resize((sz, sz), Image.LANCZOS).save(os.path.join(out, f"tray-{sz}.png"))
head.resize((32, 32), Image.LANCZOS).save(os.path.join(out, "tray.png"))
head.resize((256, 256), Image.LANCZOS).save(
    os.path.join(out, "whale.ico"),
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
print("ICON_OK", os.path.join(out, "whale.ico"))
