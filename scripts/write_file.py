import sys, base64
mode = sys.argv[1]
target = sys.argv[2]
b64_data = sys.argv[3]
data = base64.b64decode(b64_data).decode('utf-8')
with open(target, mode, encoding='utf-8') as f:
    f.write(data)
print(f'Wrote {len(data)} chars to {target}')
