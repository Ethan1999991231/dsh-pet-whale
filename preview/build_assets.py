"""把两张素材拼成一套桌宠用的图：身体一张、尾巴一张，同一画布、同一坐标。

尾巴要能单独转，所以两层的画布必须一样大，前端把 tail 绝对定位盖在 char 上，
转动时才对得上。裁到内容再拼，省掉大边距。

用法：python preview/build_assets.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
ASSETS = ROOT / "assets"

BODY = Path(r"C:\Users\Administrator\.dsh\attachments\v1\objects\d7\d70af3f6185067a4458568729c0b445a5b7d4692073e819e2d3fcf54cbbf6b80")
TAIL = Path(r"C:\Users\Administrator\.dsh\attachments\v1\objects\da\da3e80ab3ebf61e7c0e55d705d418f71679dc7c25e779d298a98a4ed889868a9")

PAD = 3
ALPHA = 8


def bbox(im: Image.Image):
    a = np.array(im)[:, :, 3]
    ys, xs = np.where(a > ALPHA)
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def main():
    body = Image.open(BODY).convert("RGBA")
    # 尾巴图的画布与身体略有出入，是同一套坐标重导出的，缩过去就对上了
    tail = Image.open(TAIL).convert("RGBA").resize(body.size, Image.LANCZOS)

    b1, b2 = bbox(body), bbox(tail)
    x0 = min(b1[0], b2[0]) - PAD
    y0 = min(b1[1], b2[1]) - PAD
    x1 = max(b1[2], b2[2]) + PAD
    y1 = max(b1[3], b2[3]) + PAD
    box = (x0, y0, x1, y1)
    print("body", b1, "tail", b2, "canvas", box, "size", (x1 - x0, y1 - y0))

    char = body.crop(box)
    tail_c = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
    tail_c.alpha_composite(tail.crop(box))

    ASSETS.mkdir(exist_ok=True)
    char.save(ASSETS / "char.webp", "WEBP", quality=92, method=6)
    tail_c.save(ASSETS / "tail.webp", "WEBP", quality=92, method=6)

    # 预览：浅底 + 叠好的样子
    prev = Image.new("RGBA", char.size, (238, 243, 251, 255))
    prev.alpha_composite(char)
    prev.alpha_composite(tail_c)
    prev.convert("RGB").save(HERE / "compose.png")

    w, h = char.size
    print("画布 %dx%d  宽高比 %.4f" % (w, h, w / h))
    print("tail bbox 相对画布:", (b2[0] - x0, b2[1] - y0, b2[2] - x0, b2[3] - y0))


if __name__ == "__main__":
    main()
