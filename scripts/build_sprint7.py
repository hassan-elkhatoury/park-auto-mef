# -*- coding: utf-8 -*-
import os

def write_file(rel_path, content):
    p = os.path.join(os.getcwd(), rel_path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Wrote: {rel_path}')
