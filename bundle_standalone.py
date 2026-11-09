import os
import re
import sys
from pathlib import Path

def bundle(target_output=None):
    base_dir = Path(__file__).resolve().parent
    public_dir = base_dir / 'public'

    if target_output:
        out_path = Path(target_output)
    elif os.environ.get('STANDALONE_OUTPUT_PATH'):
        out_path = Path(os.environ['STANDALONE_OUTPUT_PATH'])
    else:
        out_path = base_dir / 'dist' / 'basta_standalone.html'

    out_path.parent.mkdir(parents=True, exist_ok=True)

    html = (public_dir / 'index.html').read_text(encoding='utf-8')
    css = (public_dir / 'style.css').read_text(encoding='utf-8')
    qrcode_js = (public_dir / 'qrcode.min.js').read_text(encoding='utf-8')
    audio_js = (public_dir / 'audio.js').read_text(encoding='utf-8')
    dict_js = (public_dir / 'dictionary.js').read_text(encoding='utf-8')
    app_js = (public_dir / 'app.js').read_text(encoding='utf-8')

    # Replace stylesheet link with inline style
    html = re.sub(
        r'<link\s+rel="stylesheet"\s+href="/style\.css[^"]*"\s*/?>',
        lambda m: f'<style>\n{css}\n</style>',
        html
    )

    # Replace scripts with inline scripts
    html = re.sub(
        r'<script\s+src="/qrcode\.min\.js[^"]*"></script>',
        lambda m: f'<script>\n{qrcode_js}\n</script>',
        html
    )

    html = re.sub(
        r'<script\s+src="/audio\.js[^"]*"></script>',
        lambda m: f'<script>\n{audio_js}\n</script>',
        html
    )

    html = re.sub(
        r'<script\s+src="/dictionary\.js[^"]*"></script>',
        lambda m: f'<script>\n{dict_js}\n</script>',
        html
    )

    html = re.sub(
        r'<script\s+src="/app\.js[^"]*"></script>',
        lambda m: f'<script>\n{app_js}\n</script>',
        html
    )

    out_path.write_text(html, encoding='utf-8')
    print(f'Successfully bundled standalone artifact to {out_path} ({len(html)} bytes)')

    # If an auxiliary artifact path is set in env or passed as second arg, write there too
    aux_path = os.environ.get('AUX_ARTIFACT_PATH') or (sys.argv[2] if len(sys.argv) > 2 else None)
    if aux_path:
        p = Path(aux_path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(html, encoding='utf-8')
        print(f'Also mirrored standalone artifact to {p}')

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else None
    bundle(target)
