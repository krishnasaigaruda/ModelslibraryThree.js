"""Contact sheet of Blender preview renders: python3 blender/sheet.py <out.png> <prefix> [cols]"""
import sys, glob, os
from PIL import Image, ImageDraw
out, prefix = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
files = sorted(glob.glob(os.path.join(os.path.dirname(__file__), '_renders', prefix + '*.png')))
tw, th = 320, 240
W = Image.new('RGB', (tw * cols, th * ((len(files) + cols - 1) // cols)), 'white')
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((tw, th))
    ImageDraw.Draw(im).text((6, 4), os.path.basename(f)[:-4], fill=(0, 0, 0))
    W.paste(im, ((i % cols) * tw, (i // cols) * th))
W.save(out)
print(out, len(files))
